import { useEffect, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import Button from '../components/ui/Button'
import { useTranslation } from '../i18n/useI18n'
import { useAppStore } from '../store/useAppStore'

const btnPrimary =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'
const btnSecondary =
  'inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50'

export default function LandingPage() {
  const { t, locale, setLocale } = useTranslation()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-slate-900 selection:bg-[var(--color-primary)] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="text-2xl font-black tracking-tighter text-slate-950">
            pay<span className="text-[var(--color-primary)]">r.</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className="flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
              <button
                type="button"
                onClick={() => setLocale('es')}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  locale === 'es' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                aria-label={t('topbar.language.es')}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  locale === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                aria-label={t('topbar.language.en')}
              >
                EN
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full p-0"
              aria-label={t('topbar.darkmode.toggle')}
              title={t('topbar.darkmode.toggle')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary)]"
              >
                {t('landing.cta.signin')}
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800"
              >
                {t('landing.cta.start')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-24">
        <div className="text-center sm:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            <IconZap className="shrink-0" size={14} />
            <span>{t('landing.badge')}</span>
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[1.1] tracking-tight text-slate-950 sm:text-7xl">
            {t('landing.hero.line1')} <br />
            <span className="text-[var(--color-primary)]">{t('landing.hero.accent')}</span>
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-slate-600">
            {t('landing.tagline')} {t('landing.sub')}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            <Link to="/register" className={btnPrimary}>
              <IconRocket size={18} />
              {t('landing.cta.free')}
            </Link>
            <Link to="/login" className={btnSecondary}>
              {t('landing.cta.signinLong')}
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<IconShieldCheck className="text-[var(--color-primary)]" />}
            title={t('landing.card1.title')}
            desc={t('landing.f1')}
          />
          <FeatureCard
            icon={<IconZapLarge className="text-[var(--color-primary)]" />}
            title={t('landing.card2.title')}
            desc={t('landing.f2')}
          />
          <FeatureCard
            icon={<IconCheckCircle className="text-[var(--color-primary)]" />}
            title={t('landing.card3.title')}
            desc={t('landing.f3')}
          />
        </div>

        <footer className="mt-32 border-t border-[var(--color-border)] pt-8 text-center text-sm text-slate-500">
          <p>{t('landing.footer')}</p>
        </footer>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: Readonly<{ icon: ReactNode; title: string; desc: string }>) {
  return (
    <div className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 transition-colors group-hover:bg-[var(--color-primary)]/20">
        {icon}
      </div>
      <h3 className="mb-2 font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  )
}

function IconZap({ size, className }: Readonly<{ size: number; className?: string }>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" />
    </svg>
  )
}

function IconZapLarge({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  )
}

function IconShieldCheck({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconCheckCircle({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconRocket({ size }: Readonly<{ size: number }>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}
