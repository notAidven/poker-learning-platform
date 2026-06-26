import { type FormEvent, useId, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAuthErrorMessage } from '../lib/authErrors'
import { MIN_PASSWORD_LENGTH, validateNewPassword } from '../lib/accountSettings'
import { Button } from './ui/Button'
import { NightPanel } from './ui/NightPanel'
import { darkFieldClass } from './account/fields'
import { CheckIcon, LockIcon } from './icons'

/**
 * "Set a password" form shown on the profile to Google-authenticated users who
 * have no email/password credential yet. Submitting links an Email/Password
 * credential to their existing account so they can also sign in with email +
 * password. Renders nothing for accounts that already have a password.
 */
export function SetPasswordCard() {
  const { user, needsPasswordSetup, linkEmailPassword } = useAuth()
  const passwordId = useId()
  const confirmId = useId()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Only Google-only accounts see this. After a successful link `needsPasswordSetup`
  // flips false, so we keep showing the success state via `done`.
  if (!needsPasswordSetup && !done) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const validationError = validateNewPassword(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await linkEmailPassword(password)
      setPassword('')
      setConfirmPassword('')
      setDone(true)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <NightPanel className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="anim-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-500/30">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Password set</h2>
            <p className="mt-1 text-sm text-white/70">
              You can now sign in with your email and password, or keep using Google.
            </p>
          </div>
        </div>
      </NightPanel>
    )
  }

  return (
    <NightPanel className="p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-500/30">
          <LockIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-tight">Set a password</h2>
          <p className="mt-1 text-sm text-white/70">
            You signed in with Google. Add a password to also sign in with your email
            {user?.email ? (
              <>
                {' '}
                <span className="font-semibold text-white/90">{user.email}</span>
              </>
            ) : null}
            .
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-brand-400/40 bg-brand-500/15 px-4 py-3 text-sm text-brand-100"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-white/85">
            New password
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={darkFieldClass}
          />
        </div>

        <div>
          <label htmlFor={confirmId} className="block text-sm font-medium text-white/85">
            Confirm password
          </label>
          <input
            id={confirmId}
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className={darkFieldClass}
          />
        </div>

        <Button type="submit" variant="gold" size="lg" fullWidth disabled={submitting}>
          {submitting ? 'Saving…' : 'Set password'}
        </Button>
      </form>
    </NightPanel>
  )
}
