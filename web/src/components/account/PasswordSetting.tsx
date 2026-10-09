import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { validateNewPassword } from '../../lib/accountSettings'
import { Button } from '../ui/Button'
import { KeyIcon } from './icons'
import { DarkAlert, DarkField, DarkNotice } from './fields'
import { SettingRow } from './SettingRow'

/** Anchor id of the standalone SetPasswordCard rendered on the profile page. */
export const SET_PASSWORD_ANCHOR_ID = 'set-password'

/** Scroll to and focus the existing "Set a password" card (Google-only users). */
function focusSetPasswordCard() {
  const el = document.getElementById(SET_PASSWORD_ANCHOR_ID)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.setTimeout(() => {
    el.querySelector<HTMLInputElement>('input[type="password"]')?.focus()
  }, 320)
}

export function PasswordSetting() {
  const { hasPassword, needsPasswordSetup, reauthenticate, changePassword } = useAuth()
  const controlsId = useId()
  const [editing, setEditing] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const currentRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) currentRef.current?.focus()
  }, [editing])

  // Google-only accounts with no password yet: reuse the existing SetPasswordCard
  // flow rather than duplicating it. This row just points them to that card.
  if (needsPasswordSetup) {
    return (
      <SettingRow
        icon={
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70">
            <KeyIcon className="h-4 w-4" />
          </span>
        }
        title="Password"
        description="You sign in with Google. Add a password to also sign in with your email."
        editing={false}
        onToggle={() => {}}
        controlsId={controlsId}
        action={
          <Button
            variant="glass"
            size="sm"
            className="shrink-0"
            aria-controls={SET_PASSWORD_ANCHOR_ID}
            onClick={focusSetPasswordCard}
          >
            Set a password
          </Button>
        }
      />
    )
  }

  function open() {
    setCurrentPassword('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const validationError = validateNewPassword(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }
    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      // Re-authenticate with the current password first (Firebase requires a
      // recent login before updatePassword), then set the new one.
      await reauthenticate(currentPassword)
      await changePassword(password)
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
      setSuccess('Password updated.')
      setEditing(false)
    } catch (err) {
      setError(getAuthErrorMessage(err, 'reauth'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingRow
      icon={
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70">
          <KeyIcon className="h-4 w-4" />
        </span>
      }
      title="Password"
      currentValue={hasPassword ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : 'Not set'}
      editing={editing}
      onToggle={editing ? cancel : open}
      editLabel="Change"
      controlsId={controlsId}
      disabled={busy}
      feedback={!editing && success ? <DarkNotice>{success}</DarkNotice> : null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <DarkAlert>{error}</DarkAlert>}
        <DarkField
          ref={currentRef}
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter your current password"
        />
        <DarkField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        <DarkField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
        />
        <div className="flex gap-2">
          <Button type="submit" variant="gold" disabled={busy}>
            {busy ? 'Saving\u2026' : 'Update password'}
          </Button>
          <Button type="button" variant="glass" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </SettingRow>
  )
}
