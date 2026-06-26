import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAuthErrorMessage } from '../lib/authErrors'
import { AuthLayout } from '../components/ui/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field, FormError, GoogleButton, OrDivider } from '../components/ui/form'

export function SignUpPage() {
  const navigate = useNavigate()
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleGoogle() {
    setError(null)
    setSubmitting(true)
    try {
      await signInWithGoogle()
      navigate('/setup-profile')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    // The mismatch surfaces inline on the confirm field (with a transition); just
    // block the submit here so we never create an account with the wrong password.
    if (password !== confirmPassword) {
      return
    }

    setSubmitting(true)
    try {
      await signUpWithEmail(email, password)
      navigate('/setup-profile')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up with email or Google, then pick a username and avatar."
      footer={
        <p className="text-center text-sm text-night-700/70">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 transition hover:text-brand-700">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4">
          <FormError>{error}</FormError>
        </div>
      )}

      <GoogleButton onClick={handleGoogle} disabled={submitting} label="Sign up with Google" />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          hint="At least 6 characters."
        />
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          error={passwordsMismatch ? 'Passwords do not match.' : undefined}
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Continue
        </Button>
      </form>
    </AuthLayout>
  )
}
