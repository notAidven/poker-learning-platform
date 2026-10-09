/**
 * Firebase ID token verification for a Cloudflare Worker, using ONLY Web Crypto
 * (no runtime dependencies).
 *
 * A Firebase ID token is an RS256-signed JWT. We verify one by:
 *   1. fetching Google's public x509 certificates from the securetoken endpoint
 *      (cached per the response's Cache-Control max-age);
 *   2. selecting the cert whose key id (`kid`) matches the JWT header;
 *   3. extracting the SubjectPublicKeyInfo (SPKI) from the x509 certificate and
 *      verifying the RS256 signature over `header.payload` with Web Crypto;
 *   4. checking the standard claims: `aud` === project id,
 *      `iss` === https://securetoken.google.com/<project id>, and `exp` (not
 *      expired), plus light sanity checks on `iat`/`auth_time`/`sub`.
 *
 * Any failure resolves to `null` so the caller can respond with 401 — we never
 * throw to the request handler and never leak token internals.
 */

const PUBLIC_KEYS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

/** Allow a little clock skew (seconds) when comparing time-based claims. */
const CLOCK_SKEW_SEC = 300

/** A verified token's essentials (only what the proxy needs). */
export type VerifiedToken = {
  uid: string
}

/** Map of `kid` -> PEM x509 certificate, as returned by the securetoken endpoint. */
type CertMap = Record<string, string>

// In-isolate cache of Google's signing certs (survives across requests on a warm
// isolate). Respect the endpoint's Cache-Control max-age so we re-fetch on rotation.
let cachedCerts: CertMap | null = null
let certsExpireAtMs = 0

/**
 * Verify a Firebase ID token. Returns the verified principal, or `null` if the
 * token is missing pieces, fails signature verification, or has invalid claims.
 */
export async function verifyIdToken(
  token: string,
  projectId: string,
): Promise<VerifiedToken | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, signatureB64] = parts

  let header: { alg?: string; kid?: string }
  let payload: Record<string, unknown>
  try {
    header = JSON.parse(bytesToText(base64UrlToBytes(headerB64)))
    payload = JSON.parse(bytesToText(base64UrlToBytes(payloadB64)))
  } catch {
    return null
  }

  // 1) Header must be RS256 with a key id.
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length === 0) {
    return null
  }

  // 2) Claims (cheap, no network) — reject before doing crypto if obviously wrong.
  if (!claimsValid(payload, projectId)) return null

  // 3) Signature: fetch (cached) cert for this kid, extract its public key, verify.
  let certs: CertMap
  try {
    certs = await getCerts()
  } catch {
    return null
  }
  const pem = certs[header.kid]
  if (!pem) return null

  let key: CryptoKey
  try {
    key = await importCertPublicKey(pem)
  } catch {
    return null
  }

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  let signatureValid = false
  try {
    signatureValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(signatureB64),
      data,
    )
  } catch {
    return null
  }
  if (!signatureValid) return null

  return { uid: payload.sub as string }
}

/**
 * Validate the standard Firebase ID token claims. The audience must be the
 * project id, the issuer must be securetoken for that project, the token must not
 * be expired, and `iat`/`auth_time` must not be in the (skew-adjusted) future.
 */
function claimsValid(payload: Record<string, unknown>, projectId: string): boolean {
  const nowSec = Math.floor(Date.now() / 1000)
  const expectedIss = `https://securetoken.google.com/${projectId}`

  if (payload.aud !== projectId) return false
  if (payload.iss !== expectedIss) return false

  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return false
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + CLOCK_SKEW_SEC) return false

  if (
    payload.auth_time !== undefined &&
    (typeof payload.auth_time !== 'number' || payload.auth_time > nowSec + CLOCK_SKEW_SEC)
  ) {
    return false
  }

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return false

  return true
}

/**
 * Return Google's securetoken signing certificates, using the in-isolate cache
 * until it expires (per the endpoint's Cache-Control max-age).
 */
async function getCerts(): Promise<CertMap> {
  const now = Date.now()
  if (cachedCerts && now < certsExpireAtMs) return cachedCerts

  const res = await fetch(PUBLIC_KEYS_URL)
  if (!res.ok) throw new Error('Failed to fetch Firebase public keys')

  const certs = (await res.json()) as CertMap
  cachedCerts = certs
  certsExpireAtMs = now + maxAgeMs(res.headers.get('cache-control'))
  return certs
}

/** Parse `max-age` (ms) from a Cache-Control header; default 1 hour. */
function maxAgeMs(cacheControl: string | null): number {
  const fallback = 3600 * 1000
  if (!cacheControl) return fallback
  const match = /max-age=(\d+)/.exec(cacheControl)
  if (!match) return fallback
  const seconds = Number.parseInt(match[1], 10)
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : fallback
}

/**
 * Import the RSA public key from a PEM x509 certificate as a Web Crypto verify
 * key. Web Crypto's `importKey('spki', ...)` wants a SubjectPublicKeyInfo, not a
 * full certificate, so we parse the cert's DER to locate and slice out the SPKI.
 */
async function importCertPublicKey(pem: string): Promise<CryptoKey> {
  const spki = extractSpkiFromCertificate(pemToDer(pem))
  return crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
}

// --- minimal ASN.1 DER walking (just enough to find the SPKI) ---------------

type DerNode = {
  tag: number
  /** Index of the tag byte (start of the whole TLV node). */
  start: number
  /** Index of the first content byte. */
  contentStart: number
  /** Index one past the last content byte (also the end of the node). */
  end: number
}

/** Read a single DER TLV node beginning at `start`. */
function readNode(buf: Uint8Array, start: number): DerNode {
  let i = start
  const tag = buf[i++]
  let length = buf[i++]
  if ((length & 0x80) !== 0) {
    const numBytes = length & 0x7f
    length = 0
    for (let j = 0; j < numBytes; j++) {
      length = length * 256 + buf[i++]
    }
  }
  const contentStart = i
  return { tag, start, contentStart, end: contentStart + length }
}

/** Read all immediate child TLV nodes within a constructed node's content range. */
function readChildren(buf: Uint8Array, node: DerNode): DerNode[] {
  const children: DerNode[] = []
  let i = node.contentStart
  while (i < node.end) {
    const child = readNode(buf, i)
    children.push(child)
    i = child.end
  }
  return children
}

/**
 * Locate the SubjectPublicKeyInfo within a DER-encoded x509 certificate and
 * return its raw bytes (header + content) — exactly the SPKI that Web Crypto's
 * `importKey('spki', ...)` expects.
 *
 * Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
 * TBSCertificate ::= SEQUENCE { [0] version OPTIONAL, serialNumber, signature,
 *                               issuer, validity, subject, subjectPublicKeyInfo, ... }
 */
function extractSpkiFromCertificate(der: Uint8Array): Uint8Array {
  const certificate = readNode(der, 0)
  const tbsCertificate = readChildren(der, certificate)[0]
  const tbsFields = readChildren(der, tbsCertificate)

  // The optional, EXPLICIT [0] version field has context tag 0xA0. When present
  // (v2/v3 certs — Google's are v3), the SPKI is the 7th field; otherwise the 6th.
  const versionPresent = tbsFields.length > 0 && tbsFields[0].tag === 0xa0
  const spkiIndex = (versionPresent ? 1 : 0) + 5
  const spki = tbsFields[spkiIndex]
  if (!spki || spki.tag !== 0x30) {
    throw new Error('Could not locate SubjectPublicKeyInfo in certificate')
  }
  return der.slice(spki.start, spki.end)
}

// --- base64url / text helpers -----------------------------------------------

/** Decode a base64url string (no/with padding) to bytes. */
function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64.length % 4 === 0 ? b64 : b64 + '='.repeat(4 - (b64.length % 4))
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Strip PEM armor from an x509 certificate and decode the base64 body to DER. */
function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '')
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}
