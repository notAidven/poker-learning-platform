import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../contexts/useAuth'
import { changeUsername, validateUsername } from '../../lib/userProfile'
import { Button } from '../ui/Button'
import { AtIcon } from './icons'
import { DarkAlert, DarkField, DarkNotice } from './fields'
import { SettingRow } from './SettingRow'

export function UsernameSetting() {
  const { user, profile, refreshProfile } = useAuth()
  const controlsId = useId()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(profile?.username ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function open() {
    setValue(profile?.username ?? '')
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
    if (!user?.email) {
      setError('Your account is missing an email address.')
      return
    }

    const validationError = validateUsername(value)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await changeUsername(user.uid, user.email, value, profile?.username ?? null)
      await refreshProfile()
      setSuccess('Username updated.')
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your username.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingRow
      icon={
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70">
          <AtIcon className="h-4 w-4" />
        </span>
      }
      title="Username"
      currentValue={profile?.username ?? 'Not set'}
      editing={editing}
      onToggle={editing ? cancel : open}
      controlsId={controlsId}
      disabled={busy}
      feedback={!editing && success ? <DarkNotice>{success}</DarkNotice> : null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <DarkAlert>{error}</DarkAlert>}
        <DarkField
          ref={inputRef}
          label="New username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="maya_chen"
          hint={'3\u201320 characters. Letters, numbers, and underscores only.'}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="gold" disabled={busy}>
            {busy ? 'Saving\u2026' : 'Save username'}
          </Button>
          <Button type="button" variant="glass" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </SettingRow>
  )
}
