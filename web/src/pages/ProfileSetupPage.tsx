import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimalPicker } from '../components/AnimalPicker'
import { useAuth } from '../contexts/AuthContext'
import type { ProfileAnimalId } from '../data/animals'
import {
  completeProfileSetup,
  isUsernameAvailable,
  validateUsername,
} from '../lib/userProfile'
import { AuthLayout } from '../components/ui/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field, FormError } from '../components/ui/form'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [animal, setAnimal] = useState<ProfileAnimalId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const usernameError = validateUsername(username)
    if (usernameError) {
      setError(usernameError)
      return
    }

    if (!animal) {
      setError('Choose a profile animal.')
      return
    }

    if (!user?.email) {
      setError('Your account is missing an email address.')
      return
    }

    setSubmitting(true)
    try {
      const available = await isUsernameAvailable(username)
      if (!available) {
        setError('Username is already taken.')
        return
      }

      await completeProfileSetup(user.uid, user.email, username, animal)
      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Set up your profile"
      subtitle="Pick a unique username and an avatar. One quick step before you start learning."
    >
      {error && (
        <div className="mb-4">
          <FormError>{error}</FormError>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          label="Username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="maya_chen"
          hint="3–20 characters. Letters, numbers, and underscores only."
        />

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Profile animal</legend>
          <p className="mt-0.5 text-xs text-slate-500">This shows up next to your name.</p>
          <div className="mt-3">
            <AnimalPicker value={animal} onChange={setAnimal} />
          </div>
        </fieldset>

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
          {submitting ? 'Saving…' : 'Start learning'}
        </Button>
      </form>
    </AuthLayout>
  )
}
