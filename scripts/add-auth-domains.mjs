#!/usr/bin/env node
/**
 * Adds localhost + project hosting domains to Firebase Auth authorized domains.
 * Run after: firebase login
 *
 *   node scripts/add-auth-domains.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const projectId = 'brilliant-alpha-clone-54be9'
const configPath = path.join(
  process.env.HOME ?? '',
  '.config',
  'configstore',
  'firebase_tools.json',
)

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const refreshToken = config?.tokens?.refresh_token ?? config?.refreshToken
if (!refreshToken) {
  console.error('Not logged in. Run: npx firebase-tools@latest login')
  process.exit(1)
}

const clientId = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const clientSecret = 'j9iVWfS8xxCEFoPCujYIs'

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) {
    console.error('Could not refresh access token:', data)
    process.exit(1)
  }
  return data.access_token
}

const token = await getAccessToken()

const getRes = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
  { headers: { Authorization: `Bearer ${token}` } },
)
const current = await getRes.json()
if (!getRes.ok) {
  console.error('Failed to read auth config:', current)
  process.exit(1)
}

console.log('Before:', current.authorizedDomains)

const required = [
  'localhost',
  '127.0.0.1',
  `${projectId}.firebaseapp.com`,
  `${projectId}.web.app`,
]
const merged = [...new Set([...(current.authorizedDomains ?? []), ...required])]

const patchRes = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=authorizedDomains`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizedDomains: merged }),
  },
)
const updated = await patchRes.json()
if (!patchRes.ok) {
  console.error('Failed to update auth config:', updated)
  process.exit(1)
}

console.log('After:', updated.authorizedDomains)
console.log('Done. Refresh Firebase Console → Authentication → Settings → Authorized domains.')
