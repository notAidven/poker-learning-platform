import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAuthErrorMessage } from '../lib/authErrors'
import { AuthLayout } from '../components/ui/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field, FormError, GoogleButton, OrDivider } from '../components/ui/form'

type LoginMode = 'signin' | 'reset'

export function LoginPage() {
  const navigate = useNavigate()
  const { signInWithUsername, signInWithGoogle, resetPassword } = useAuth()
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

  if (mode === 'reset') {
    return (
      <AuthLayout
        title="Reset your password"
        subtitle="Enter your username and we will email a reset link to the address on the account."
        footer={
          <p className="text-center text-sm text-slate-500">
            Remembered it?{' '}
            <button
              type="button"
              onClick={goToSignIn}
              className="font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Back to sign in
            </button>
          </p>
        }
      >
        {error && (
          <div className="mb-4">
            <FormError>{error}</FormError>
          </div>
        )}

        {resetSent ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              If an account matches that username, a password reset link is on its way to
              the email on file. Check your inbox — and your spam folder — to continue.
            </p>
            <Button type="button" variant="primary" size="lg" fullWidth onClick={goToSignIn}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <Field
              label="Username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
            />
            <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your username and password, or continue with Google."
      footer={
        <p className="text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 transition hover:text-brand-700">
            Create an account
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4">
          <FormError>{error}</FormError>
        </div>
      )}

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
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
