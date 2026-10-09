import { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileAnimals, type ProfileAnimalId } from '../../data/animals'
import { updateProfileAnimal } from '../../lib/userProfile'
import { AnimalAvatar } from '../AnimalAvatar'
import { AnimalPicker } from '../AnimalPicker'
import { Button } from '../ui/Button'
import { DarkAlert, DarkNotice } from './fields'
import { SettingRow } from './SettingRow'

export function AvatarSetting() {
  const { user, profile, refreshProfile } = useAuth()
  const controlsId = useId()
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<ProfileAnimalId | null>(
    profile?.profileAnimal ?? null,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing) pickerRef.current?.querySelector('button')?.focus()
  }, [editing])

  const currentLabel =
    profileAnimals.find((a) => a.id === profile?.profileAnimal)?.label ?? 'Not set'

  function open() {
    setSelected(profile?.profileAnimal ?? null)
    setError(null)
    setSuccess(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
  }

  async function save() {
    if (!user) return
    if (!selected) {
      setError('Choose a profile animal.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updateProfileAnimal(user.uid, selected)
      await refreshProfile()
      setSuccess('Avatar updated.')
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your avatar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingRow
      icon={<AnimalAvatar id={profile?.profileAnimal} size="sm" />}
      title="Avatar"
      currentValue={currentLabel}
      editing={editing}
      onToggle={editing ? cancel : open}
      editLabel="Change"
      controlsId={controlsId}
      disabled={busy}
      feedback={!editing && success ? <DarkNotice>{success}</DarkNotice> : null}
    >
      <div className="space-y-4">
        {error && <DarkAlert>{error}</DarkAlert>}
        <div
          ref={pickerRef}
          className="rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10"
        >
          <AnimalPicker value={selected} onChange={setSelected} />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="gold" onClick={save} disabled={busy}>
            {busy ? 'Saving\u2026' : 'Save avatar'}
          </Button>
          <Button type="button" variant="glass" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </SettingRow>
  )
}
