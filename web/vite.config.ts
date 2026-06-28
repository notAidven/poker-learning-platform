import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Pull the big *eagerly-loaded* vendor libraries out of the app entry chunk so it stays
 * small (well under Vite's 500 kB warning) and first paint isn't gated on parsing one
 * giant bundle. These chunks ARE part of first load (they're modulepreloaded), but
 * splitting them shrinks the entry and lets them download in parallel + cache
 * independently:
 *   - `firebase-*` — by far the largest dep, pulled in eagerly by the auth + progress
 *                    providers. Split PER PRODUCT (firestore / auth / ai / app-check /
 *                    core) so no single chunk trips the 500 kB warning.
 *   - `react-vendor` / `router` — the framework runtime.
 *   - `motion`     — animation library used by the layout on every page.
 *
 * IMPORTANT: do NOT manually-chunk dependencies that are only reached through dynamic
 * imports (KaTeX/markdown, dnd-kit, the poker table). rolldown-vite preloads named
 * manual chunks as part of the initial graph, which would force those heavy, route-only
 * deps into first load. Left alone, Vite auto-splits them into genuinely lazy chunks
 * that load only with their route — so KaTeX & co. never reach the initial bundle.
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes('/node_modules/')) return undefined

  // Firebase SDK, split per product so each chunk stays comfortably under 500 kB.
  if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) {
    if (id.includes('firestore')) return 'firebase-firestore'
    if (id.includes('/auth')) return 'firebase-auth'
    if (id.includes('/ai') || id.includes('vertexai')) return 'firebase-ai'
    if (id.includes('app-check')) return 'firebase-appcheck'
    return 'firebase-core' // app, installations, util, component, logger, …
  }

  // Animation library — used eagerly by the layout, so it's part of first load anyway.
  if (
    id.includes('/node_modules/motion/') ||
    id.includes('/node_modules/motion-dom/') ||
    id.includes('/node_modules/motion-utils/') ||
    id.includes('/node_modules/framer-motion/')
  ) {
    return 'motion'
  }

  if (id.includes('/node_modules/react-router')) {
    return 'router'
  }

  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/scheduler/')
  ) {
    return 'react-vendor'
  }

  return undefined
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
