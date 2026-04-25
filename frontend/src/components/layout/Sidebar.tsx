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

const navItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/bills', label: 'Bills', icon: FileText },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const logout = useAppStore((state) => state.logout)
  const legalEntities = useAppStore((state) => state.legalEntities)
  const selectedEntityId = useAppStore((state) => state.selectedEntityId)
  const setSelectedEntityId = useAppStore((state) => state.setSelectedEntityId)
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
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
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'sidebar-link-active bg-[#dff5fb] text-[var(--color-sidebar-active)]'
                    : 'text-[var(--color-sidebar-text)] hover:bg-slate-200/60'
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className='space-y-4'>
        <div className='space-y-1 text-sm text-[var(--color-sidebar-text)]'>
          <Button
            variant='ghost'
            className='flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left'
          >
            <CircleHelp size={15} /> Help & Support
          </Button>
          <Button
            variant='ghost'
            className='flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left'
          >
            <Shield size={15} /> Privacy Policy
          </Button>
        </div>

        <Button
          onClick={onLogout}
          className='flex w-full items-center justify-center gap-2 shadow-sm'
        >
          <LogOut size={14} /> Logout
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
  )
}
