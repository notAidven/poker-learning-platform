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
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">Set up your profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pick a unique username and animal avatar. This step is required before
          you can start learning.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-brand-600 focus:ring-2"
              placeholder="maya_chen"
            />
            <span className="mt-1 block text-xs text-slate-500">
              3–20 characters. Letters, numbers, and underscores only.
            </span>
          </label>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">
              Profile animal
            </legend>
            <div className="mt-3">
              <AnimalPicker value={animal} onChange={setAnimal} />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Start learning'}
          </button>
        </form>
      </div>
    </div>
  )
}
