import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AnimalPicker } from '../components/AnimalPicker'
import { useAuth } from '../contexts/useAuth'
import type { ProfileAnimalId } from '../data/animals'
import {
  completeProfileSetup,
  isUsernameAvailable,
  validateUsername,
} from '../lib/userProfile'
import { DUR, EASE, SPRING } from '../lib/motion'
import { AuthLayout } from '../components/ui/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field, FormError } from '../components/ui/form'
import { usePrefersReducedMotion } from '../components/lesson/interactions/usePrefersReducedMotion'
import { CheckIcon, SpadeIcon } from '../components/icons'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const reduced = usePrefersReducedMotion()
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<ProfileAnimalId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const navTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(navTimer.current), [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const usernameError = validateUsername(username)
    if (usernameError) {
      setError(usernameError)
      return
    }

    if (!avatar) {
      setError('Choose a profile avatar.')
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

      await completeProfileSetup(user.uid, user.email, username, avatar)
      await refreshProfile()
      // Win the pot: rake a quick "dealing you in" flourish before entering the app.
      if (reduced) {
        navigate('/')
        return
      }
      setCelebrating(true)
      navTimer.current = window.setTimeout(() => navigate('/'), 950)
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
          <legend className="flex w-full items-center justify-between gap-2 text-sm font-medium text-night-800">
            <span>Profile avatar</span>
            <AnimatePresence>
              {avatar && (
                <motion.span
                  key="picked"
                  className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success-700 ring-1 ring-inset ring-success-200"
                  initial={reduced ? false : { opacity: 0, scale: 0.7, y: -2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                  transition={reduced ? { duration: 0 } : { ...SPRING }}
                >
                  <CheckIcon className="h-3 w-3" strokeWidth={3} />
                  Selected
                </motion.span>
              )}
            </AnimatePresence>
          </legend>
          <p className="mt-0.5 text-xs text-night-700/60">This shows up next to your name.</p>
          <div className="mt-3">
            <AnimalPicker value={avatar} onChange={setAvatar} />
          </div>
        </fieldset>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Start learning
        </Button>
      </form>

      <AnimatePresence>{celebrating && <DealInCelebration />}</AnimatePresence>
    </AuthLayout>
  )
}

const rakeChips = [
  { x: -150, y: -46 },
  { x: 156, y: -34 },
  { x: -126, y: 64 },
  { x: 138, y: 74 },
  { x: 4, y: -128 },
]

/** A quick "win the pot" flourish: chips rake into a stack behind a brass spade,
 *  then the app loads. Only mounted for non-reduced-motion sessions. */
function DealInCelebration() {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-night-950/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DUR.quick }}
      role="status"
    >
      <div className="flex flex-col items-center">
        <div className="relative grid h-24 w-24 place-items-center">
          {rakeChips.map((c, i) => (
            <motion.span
              key={i}
              className="poker-chip absolute h-10 w-10"
              initial={{ x: c.x, y: c.y, opacity: 0, scale: 0.6 }}
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: DUR.deal, ease: EASE.rake, delay: i * 0.04 }}
            />
          ))}
          <motion.span
            className="relative grid h-20 w-20 place-items-center rounded-full bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-400/40"
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ ...SPRING, delay: 0.18 }}
          >
            <SpadeIcon className="h-10 w-10" />
          </motion.span>
        </div>
        <motion.p
          className="mt-6 font-display text-xl font-bold text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: DUR.base, ease: EASE.deal }}
        >
          You’re in. Dealing you in…
        </motion.p>
      </div>
    </motion.div>
  )
}
