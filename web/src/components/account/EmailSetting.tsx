import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { validateEmailChange } from '../../lib/accountSettings'
import { Button } from '../ui/Button'
import { MailIcon } from './icons'
import { DarkAlert, DarkField, DarkNotice } from './fields'
import { ReauthPrompt } from './ReauthPrompt'
import { SettingRow } from './SettingRow'

function isRecentLoginError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/requires-recent-login'
  )
}

export function EmailSetting() {
  const { user, changeEmail } = useAuth()
  const controlsId = useId()
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needReauth, setNeedReauth] = useState(false)
  // The "check your new inbox" confirmation; persists after the row collapses.
  const [pending, setPending] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && !needReauth) inputRef.current?.focus()
  }, [editing, needReauth])

  function open() {
    setNewEmail('')
    setError(null)
    setPending(null)
    setNeedReauth(false)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
    setNeedReauth(false)
  }

  // Sends the verification link. Re-run verbatim after a re-auth retry.
  async function attemptChange() {
    setBusy(true)
    setError(null)
    try {
      const trimmed = newEmail.trim()
      await changeEmail(trimmed)
      setPending(
        `Check ${trimmed} for a confirmation link. Your email changes only after you open it.`,
      )
      setNeedReauth(false)
      setEditing(false)
    } catch (err) {
      if (isRecentLoginError(err)) {
        setNeedReauth(true)
        setError(null)
      } else {
        setError(getAuthErrorMessage(err))
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const validationError = validateEmailChange(user?.email, newEmail)
    if (validationError) {
      setError(validationError)
      return
    }
    await attemptChange()
  }

  return (
    <SettingRow
      icon={
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70">
          <MailIcon className="h-4 w-4" />
        </span>
      }
      title="Email"
      currentValue={user?.email ?? 'Not set'}
      editing={editing}
      onToggle={editing ? cancel : open}
      controlsId={controlsId}
      disabled={busy}
      feedback={
        !editing && pending ? <DarkNotice tone="info">{pending}</DarkNotice> : null
      }
    >
      <div className="space-y-4">
        {error && <DarkAlert>{error}</DarkAlert>}
        {needReauth ? (
          <ReauthPrompt
            prompt={'Confirm it\u2019s you to change your email.'}
            onReauthed={attemptChange}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-white/60">
              We send a confirmation link to your new address. Your email changes
              only after you open that link, so sign in with your current email
              until then.
            </p>
            <DarkField
              ref={inputRef}
              label="New email"
              type="email"
              autoComplete="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="gold" disabled={busy}>
                {busy ? 'Sending\u2026' : 'Send confirmation link'}
              </Button>
              <Button type="button" variant="glass" onClick={cancel} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </SettingRow>
  )
}
