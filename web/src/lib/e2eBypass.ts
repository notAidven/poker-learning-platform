import type { ProfileAnimalId } from '../data/animals'
import type { UserProfile } from './userProfile'

/**
 * Dev-only auth bypass for automated UI tests.
 *
 * Gated behind `import.meta.env.DEV` so a production build (`import.meta.env.DEV`
 * is `false` after `vite build`) can NEVER enable it, even if
 * `VITE_E2E_BYPASS_AUTH=true` leaks into the prod environment (H2).
 */
export const E2E_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_E2E_BYPASS_AUTH === 'true'

export const E2E_MOCK_PROFILE: UserProfile = {
  profileComplete: true,
  username: 'e2e_tester',
  profileAnimal: 'spade' as ProfileAnimalId,
  email: 'e2e@test.local',
  level: 1,
  totalXp: 0,
  streak: 0,
  lastActivityDate: null,
  chips: 0,
  bankrollGranted: false,
}
