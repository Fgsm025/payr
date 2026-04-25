import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import Button from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { useI18n } from '../../i18n/useI18n'

type TopBarProps = Readonly<{ title: string; showNewBill: boolean }>

export default function TopBar({ title, showNewBill }: TopBarProps) {
  const openCreateBillModal = useAppStore((state) => state.openCreateBillModal)
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const authUser = useAppStore((state) => state.authUser)
  const { locale, setLocale, t } = useI18n()
  const userName = authUser?.name ?? 'Admin User'
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{t('topbar.subtitle')}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-[var(--color-border)] bg-white p-0.5">
          <button
            type="button"
            onClick={() => setLocale('es')}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              locale === 'es' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-label={t('topbar.language.es')}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
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
        <Link
          to="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-300"
          aria-label={t('topbar.account.settings')}
          title={t('topbar.account.settings')}
        >
          {initials}
        </Link>
        {showNewBill && (
          <Button className="shadow-sm" onClick={openCreateBillModal}>
            New Bill
          </Button>
        )}
      </div>
    </header>
  )
}
