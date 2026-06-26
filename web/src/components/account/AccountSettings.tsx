import { useId } from 'react'
import { NightPanel } from '../ui/NightPanel'
import { AvatarSetting } from './AvatarSetting'
import { EmailSetting } from './EmailSetting'
import { PasswordSetting } from './PasswordSetting'
import { UsernameSetting } from './UsernameSetting'

/**
 * The "Account settings" section on the profile: inline edit + save for the
 * avatar, username, email, and password. Each row owns its own validation,
 * loading, and success/error feedback. Works entirely on the client Firebase
 * Auth + Firestore SDKs (no Cloud Functions / Blaze required).
 */
export function AccountSettings() {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <NightPanel className="p-6 sm:p-8">
        <h2 id={headingId} className="font-display text-lg font-bold tracking-tight">
          Account settings
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Update your avatar, username, email, and password.
        </p>

        <div className="mt-5 divide-y divide-white/10">
          <AvatarSetting />
          <UsernameSetting />
          <EmailSetting />
          <PasswordSetting />
        </div>
      </NightPanel>
    </section>
  )
}
