import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Building2,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  ChevronDown,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import { useI18n } from '../../i18n/useI18n'
import HelpSupportModal from './HelpSupportModal'
import PrivacyPolicyModal from './PrivacyPolicyModal'

const navItems = [
  { to: '/dashboard', labelKey: 'nav.home', icon: LayoutDashboard },
  { to: '/bills', labelKey: 'nav.bills', icon: FileText },
  { to: '/vendors', labelKey: 'nav.vendors', icon: Building2 },
  { to: '/payments', labelKey: 'nav.payments', icon: CreditCard },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

type SidebarProps = Readonly<{
  onNavigate?: () => void
}>

export default function Sidebar({ onNavigate }: SidebarProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const logout = useAppStore((state) => state.logout)
  const legalEntities = useAppStore((state) => state.legalEntities)
  const selectedEntityId = useAppStore((state) => state.selectedEntityId)
  const setSelectedEntityId = useAppStore((state) => state.setSelectedEntityId)
  const { t } = useI18n()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
    onNavigate?.()
  }

  return (
    <>
    <aside className='sidebar-panel flex w-[250px] flex-col justify-between border-r border-[var(--color-border)] bg-[var(--color-sidebar)] p-5'>
      <div>
        <div className='mb-8 px-2'>
          <h1 className='text-4xl font-black leading-none text-slate-950'>
            pay<span className='text-[var(--color-primary)]'>r.</span>
          </h1>
        </div>
        <div className='mb-8'>
          <div className='mt-3'>
            <div className='relative'>
              <select
                value={selectedEntityId}
                onChange={(event) => setSelectedEntityId(event.target.value)}
                className='w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pr-8 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
              >
                {legalEntities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400'
              />
            </div>
          </div>
        </div>

        <nav className='space-y-1'>
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'sidebar-link-active bg-[#dff5fb] text-[var(--color-sidebar-active)]'
                    : 'text-[var(--color-sidebar-text)] hover:bg-slate-200/60'
                }`
              }
            >
              <Icon size={16} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className='space-y-4'>
        <div className='space-y-1 text-sm text-[var(--color-sidebar-text)]'>
          <Button
            type='button'
            variant='ghost'
            className='sidebar-footer-btn flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left'
            onClick={() => setIsHelpOpen(true)}
          >
            <CircleHelp size={15} /> {t('nav.help')}
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='sidebar-footer-btn flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left'
            onClick={() => setIsPrivacyOpen(true)}
          >
            <Shield size={15} /> {t('nav.privacy')}
          </Button>
        </div>

        <Button
          onClick={onLogout}
          className='flex w-full items-center justify-center gap-2 shadow-sm'
        >
          <LogOut size={14} /> {t('nav.logout')}
        </Button>

        <div className='flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-3 py-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700'>
            AU
          </div>
          <div>
            <p className='text-sm font-semibold text-slate-900'>Admin User</p>
            <p className='text-xs text-slate-500'>admin@payr.co</p>
          </div>
        </div>
      </div>
    </aside>
    <HelpSupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title={t('nav.help')} />
    <PrivacyPolicyModal
      isOpen={isPrivacyOpen}
      onClose={() => setIsPrivacyOpen(false)}
      title={t('nav.privacy')}
    />
    </>
  )
}
