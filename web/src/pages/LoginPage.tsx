import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAuthErrorMessage } from '../lib/authErrors'
import { AuthLayout } from '../components/ui/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field, FormError, GoogleButton, OrDivider } from '../components/ui/form'

export function LoginPage() {
  const navigate = useNavigate()
  const { signInWithUsername, signInWithGoogle } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
