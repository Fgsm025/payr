import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDone(false)
    setError('')
    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const message = response.status === 409 ? 'Email already exists.' : 'Could not create account.'
        throw new Error(message)
      }
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-7 shadow-sm"
      >
        <h1 className="text-3xl font-black leading-none text-slate-950">
          pay<span className="text-[var(--color-primary)]">r.</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">Create account</p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2"
              required
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {done && <p className="mt-3 text-sm text-emerald-600">Account created. Redirecting to sign in...</p>}

        <Button type="submit" fullWidth className="mt-6">
          Create account
        </Button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
