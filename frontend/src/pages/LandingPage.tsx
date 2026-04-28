import { useEffect, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Moon, Sun, ArrowRight, Play, Zap, Shield, Award, Star } from 'lucide-react'
import Button from '../components/ui/Button'
import { useTranslation } from '../i18n/useI18n'
import { useAppStore } from '../store/useAppStore'

const btnPrimary =
  'inline-flex items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[var(--color-primary)]/25 transition-all hover:scale-[1.03] hover:brightness-110 active:scale-[0.97]'

const btnSecondary =
  'inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-4 text-base font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.97]'

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
    <div className="min-h-screen overflow-hidden bg-[var(--color-bg)] text-slate-900 selection:bg-[var(--color-primary)] selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="flex items-center gap-1 text-3xl font-black tracking-tighter text-slate-950">
            pay<span className="text-[var(--color-primary)]">r.</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLocale('es')}
                className={`rounded-full px-4 py-1.5 transition-all ${
                  locale === 'es' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                }`}
                aria-label={t('topbar.language.es')}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-full px-4 py-1.5 transition-all ${
                  locale === 'en' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                }`}
                aria-label={t('topbar.language.en')}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full p-0"
              aria-label={t('topbar.darkmode.toggle')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            {/* Nav Links */}
            <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
              <Link
                to="/login"
                className="text-slate-600 transition-colors hover:text-[var(--color-primary)]"
              >
                {t('landing.cta.signin')}
              </Link>
              <Link
                to="/login"
                className="rounded-2xl bg-[var(--color-primary)] px-6 py-2.5 text-white transition-all hover:brightness-110"
              >
                {t('landing.new.navCta')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pb-16 pt-20 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-1 text-sm font-semibold text-[var(--color-primary)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]"></span>
              </span>{' '}
              {t('landing.new.eyebrow')}
            </div>

            <h1 className="text-6xl font-black leading-[1.05] tracking-tighter text-slate-950 md:text-7xl">
              {t('landing.new.heroLine1')}
              <br />
              <span className="bg-gradient-to-r from-[var(--color-primary)] to-violet-600 bg-clip-text text-transparent">
                {t('landing.new.heroAccent')}
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-slate-600 md:text-2xl">
              {t('landing.new.heroDesc')}
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login" className={btnPrimary}>
                <span>{t('landing.new.heroPrimaryCta')}</span>
                <ArrowRight size={22} />
              </Link>
              <Link to="/login" className={btnSecondary}>
                {t('landing.new.heroSecondaryCta')}
              </Link>
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>{' '}
              {t('landing.new.microTrust')}
            </p>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mx-auto mt-16 max-w-5xl px-6 md:mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-2xl shadow-slate-900/20 dark:bg-slate-950">
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl">
                  <Play size={42} className="ml-1 text-[var(--color-primary)]" />
                </div>
                <p className="font-medium text-slate-400">{t('landing.new.demoTitle')}</p>
                <p className="mt-1 text-xs text-slate-500">{t('landing.new.demoSubtitle')}</p>
              </div>

              {/* Fake Dashboard Overlay Elements */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur dark:bg-slate-900/95">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">{t('landing.new.totalDueLabel')}</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">$48,291</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-600">{t('landing.new.paidToday')}</div>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full w-[65%] rounded-full bg-[var(--color-primary)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-6">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-75">
            <div className="flex items-center gap-2 font-medium text-slate-400">
              <Star className="text-amber-500" size={18} /> {t('landing.new.trustTitle')}
            </div>
            <div className="font-semibold text-slate-400">•</div>
            <div className="font-medium text-slate-500">{t('landing.new.trustBrands')}</div>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <section className="bg-[var(--color-bg)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-5xl font-black tracking-tight">{t('landing.new.featuresTitle')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-slate-600">
              {t('landing.new.featuresDesc')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Shield size={28} className="text-[var(--color-primary)]" />}
              title={t('landing.new.feature1Title')}
              desc={t('landing.new.feature1Desc')}
            />
            <FeatureCard
              icon={<Zap size={28} className="text-[var(--color-primary)]" />}
              title={t('landing.new.feature2Title')}
              desc={t('landing.new.feature2Desc')}
            />
            <FeatureCard
              icon={<Award size={28} className="text-[var(--color-primary)]" />}
              title={t('landing.new.feature3Title')}
              desc={t('landing.new.feature3Desc')}
            />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / STATS */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="text-5xl font-black text-[var(--color-primary)]">98%</div>
              <div className="mt-3 text-slate-600">{t('landing.new.stat1Label')}</div>
            </div>
            <div>
              <div className="text-5xl font-black text-[var(--color-primary)]">4.2x</div>
              <div className="mt-3 text-slate-600">{t('landing.new.stat2Label')}</div>
            </div>
            <div>
              <div className="text-5xl font-black text-[var(--color-primary)]">12k+</div>
              <div className="mt-3 text-slate-600">{t('landing.new.stat3Label')}</div>
            </div>
            <div>
              <div className="text-5xl font-black text-[var(--color-primary)]">4.9/5</div>
              <div className="mt-3 text-slate-600">{t('landing.new.stat4Label')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-5xl font-black tracking-tight">{t('landing.new.finalCtaTitle')}</h2>
          <p className="mb-10 text-2xl text-slate-600">{t('landing.new.finalCtaDesc')}</p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/login" className={btnPrimary}>
              {t('landing.new.finalPrimaryCta')}
              <ArrowRight size={24} />
            </Link>
            <Link to="/login" className={btnSecondary}>
              {t('landing.new.finalSecondaryCta')}
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-500">{t('landing.new.finalTrust')}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-sm text-slate-500">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p>{t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: Readonly<{ icon: ReactNode; title: string; desc: string }>) {
  return (
    <div className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-900/10">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 transition-colors group-hover:bg-[var(--color-primary)]/20">
        {icon}
      </div>
      <h3 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="text-lg leading-relaxed text-slate-600">{desc}</p>
    </div>
  )
}
