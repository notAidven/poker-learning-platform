import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAI, getGenerativeModel, GoogleAIBackend, type GenerativeModel } from 'firebase/ai'
// Optional App Check — only wired up when a reCAPTCHA Enterprise site key is provided.
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function assertFirebaseConfig() {
  // SECURITY: read each var with STATIC `import.meta.env.X` access only — never the
  // dynamic `import.meta.env[key]` form. A dynamic lookup can't be statically replaced,
  // so Vite inlines the ENTIRE env object (every VITE_* var, including a stray
  // VITE_OPENAI_API_KEY / VITE_ANTHROPIC_API_KEY) into the client bundle. Listing the
  // required keys explicitly keeps unrelated secrets out of the build.
  const required: ReadonlyArray<readonly [name: string, value: string | undefined]> = [
    ['VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY],
    ['VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN],
    ['VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID],
    ['VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID],
  ]

  const missing = required.filter(([, value]) => !value).map(([name]) => name)
  if (missing.length === 0) return

  const message = `Firebase config incomplete. Missing: ${missing.join(', ')}. Copy web/.env.example to web/.env.local and add your Web app config from the Firebase console.`

  // Fail fast in PRODUCTION: a build shipped without real Firebase config can't
  // reach Auth/Firestore at all, so a loud throw on startup beats a silently
  // broken app. In dev/test we only warn, so local tooling and unit tests keep
  // running before web/.env.local is filled in. (`vite build` never executes this
  // module, so the throw can't break the build itself.)
  if (import.meta.env.PROD) {
    throw new Error(message)
  }
  console.warn(message)
}

assertFirebaseConfig()

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export { app }

// --- Firebase App Check (optional) -----------------------------------------
// App Check is enabled only when a reCAPTCHA Enterprise site key is configured.
// It is wrapped in try/catch so a missing/invalid key never breaks app startup.
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (error) {
    console.warn('Firebase App Check could not be initialized; continuing without it.', error)
  }
}

// --- Firebase AI Logic (Gemini) --------------------------------------------
// Lazily construct a single Gemini model the first time it is requested. The
// model is built inside a try/catch so an unprovisioned project (or missing
// apiKey/projectId) yields `null` instead of throwing at import or call time.
const GEMINI_MODEL_NAME = 'gemini-flash-latest'

let geminiModel: GenerativeModel | null = null
let geminiModelResolved = false

/**
 * Returns a cached Gemini model, or `null` when Firebase AI Logic is not
 * available/provisioned. Never throws — callers should treat `null` as
 * "AI is off" and fall back to rule-based behavior.
 */
export function getGeminiModel(): GenerativeModel | null {
  if (geminiModelResolved) return geminiModel
  geminiModelResolved = true

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() })
    geminiModel = getGenerativeModel(ai, { model: GEMINI_MODEL_NAME })
  } catch (error) {
    console.warn('Firebase AI Logic is unavailable; AI features will use fallbacks.', error)
    geminiModel = null
  }

  return geminiModel
}
