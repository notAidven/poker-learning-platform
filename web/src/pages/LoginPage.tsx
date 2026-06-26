import { type FormEvent, type ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { getAuthErrorMessage } from '../lib/authErrors'
import { DUR, EASE } from '../lib/motion'
import { AuthLayout } from '../components/ui/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field, FormError, GoogleButton, OrDivider } from '../components/ui/form'
import { usePrefersReducedMotion } from '../components/lesson/interactions/usePrefersReducedMotion'

type LoginMode = 'signin' | 'reset'
type LoginView = 'signin' | 'reset' | 'reset-sent'

export function LoginPage() {
  const navigate = useNavigate()
  const { signInWithUsername, signInWithGoogle, resetPassword } = useAuth()
  const reduced = usePrefersReducedMotion()
  const [mode, setMode] = useState<LoginMode>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  function goToReset() {
    setError(null)
    setResetSent(false)
    setMode('reset')
  }

  function goToSignIn() {
    setError(null)
    setMode('signin')
  }

  async function handleGoogle() {
    setError(null)
    setSubmitting(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithUsername(username, password)
      navigate('/')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await resetPassword(username)
      // Generic confirmation regardless of whether the account exists, so the
      // form can never be used to discover which usernames are registered.
      setResetSent(true)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const view: LoginView = mode === 'reset' ? (resetSent ? 'reset-sent' : 'reset') : 'signin'
  const isReset = mode === 'reset'

  const copy = isReset
    ? {
        title: 'Reset your password',
        subtitle:
          'Enter your username and we will email a reset link to the address on the account.',
        footer: (
          <p className="text-center text-sm text-night-700/70">
            Remembered it?{' '}
            <button
              type="button"
              onClick={goToSignIn}
              className="font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Back to sign in
            </button>
          </p>
        ),
      }
    : {
        title: 'Welcome back',
        subtitle: 'Sign in with your username and password, or continue with Google.',
        footer: (
          <p className="text-center text-sm text-night-700/70">
            New here?{' '}
            <Link to="/signup" className="font-semibold text-brand-600 transition hover:text-brand-700">
              Create an account
            </Link>
          </p>
        ),
      }

  let body: ReactNode
  if (view === 'reset-sent') {
    body = (
      <div className="space-y-4">
        <p className="rounded-control border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800">
          If an account matches that username, a password reset link is on its way to the email on
          file. Check your inbox — and your spam folder — to continue.
        </p>
        <Button type="button" variant="primary" size="lg" fullWidth onClick={goToSignIn}>
          Back to sign in
        </Button>
      </div>
    )
  } else if (view === 'reset') {
    body = (
      <form onSubmit={handleReset} className="space-y-4">
        <Field
          label="Username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_username"
          hint="Sign in with your username, not the email you signed up with."
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Send reset link
        </Button>
      </form>
    )
  } else {
    body = (
      <>
        <GoogleButton onClick={handleGoogle} disabled={submitting} />
        <OrDivider />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goToReset}
              className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Forgot password?
            </button>
          </div>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>
      </>
    )
  }

  const swap = reduced
    ? { duration: 0 }
    : { duration: DUR.base, ease: EASE.deal }

  return (
    <AuthLayout title={copy.title} subtitle={copy.subtitle} footer={copy.footer}>
      {error && (
        <div className="mb-4">
          <FormError>{error}</FormError>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          className="-m-2 overflow-hidden p-2"
          initial={reduced ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={swap}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  )
}
