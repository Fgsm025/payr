import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@payr.co')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const login = useAppStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard'

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const ok = await login({ email, password })
    if (!ok) {
      setError('Invalid credentials.')
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-7 shadow-sm">
        <div className="mb-4">
          <h1 className="text-4xl font-black leading-none text-slate-950">
            pay<span className="text-[var(--color-primary)]">r.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to your finance workspace.</p>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2" required />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" fullWidth className="mt-6">Sign in</Button>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  )
}
