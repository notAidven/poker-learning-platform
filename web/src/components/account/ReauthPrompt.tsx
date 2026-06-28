import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/useAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { Button } from '../ui/Button'
import { DarkAlert, DarkField } from './fields'

type ReauthPromptProps = {
  /** Why we're asking, shown above the control. */
  prompt?: string
  /** Called after a successful re-authentication (retry the sensitive op here). */
  onReauthed: () => void | Promise<void>
}

/**
 * The shared re-authentication step. For accounts with a password it asks for the
 * current password; Google-only accounts confirm through a Google popup. Both
 * paths call the one `reauthenticate` helper on AuthContext, then run `onReauthed`.
 */
export function ReauthPrompt({ prompt, onReauthed }: ReauthPromptProps) {
  const { hasPassword, reauthenticate } = useAuth()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hasPassword) passwordRef.current?.focus()
  }, [hasPassword])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await reauthenticate(hasPassword ? password : undefined)
      setPassword('')
      await onReauthed()
    } catch (err) {
      setError(getAuthErrorMessage(err, 'reauth'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-white/10 bg-night-950/40 p-4"
    >
      <p className="text-sm text-white/70">
        {prompt ?? 'For your security, confirm it\u2019s you to continue.'}
      </p>
      {error && <DarkAlert>{error}</DarkAlert>}
      {hasPassword && (
        <DarkField
          ref={passwordRef}
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your current password"
        />
      )}
      <Button type="submit" variant="gold" disabled={busy}>
        {busy ? 'Confirming\u2026' : hasPassword ? 'Confirm' : 'Confirm with Google'}
      </Button>
    </form>
  )
}
