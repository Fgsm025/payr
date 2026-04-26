import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAppStore } from '../../store/useAppStore'
import { useI18n } from '../../i18n/useI18n'

const pageTitleKeys: Record<string, string> = {
  '/dashboard': 'page.overview',
  '/bills': 'page.bills',
  '/vendors': 'page.vendors',
  '/payments': 'page.payments',
  '/settings': 'page.settings',
}

export default function Layout() {
  const location = useLocation()
  const theme = useAppStore((state) => state.theme)
  const { t } = useI18n()
  const title = t(pageTitleKeys[location.pathname] ?? 'page.default')
  const subtitle = location.pathname === '/payments' ? 'Completed bill payments.' : undefined
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className='h-screen overflow-hidden p-2 md:px-3 md:py-6 lg:px-1 lg:py-7'>
      <div className='app-shell relative mx-auto flex h-[calc(100vh-1rem)] w-full max-w-[1780px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:h-[calc(100vh-3rem)] md:rounded-[28px] lg:h-[calc(100vh-3.5rem)]'>
        <div className='hidden md:flex'>
          <Sidebar />
        </div>

        {isMobileSidebarOpen && (
          <div className='absolute inset-0 z-40 md:hidden'>
            <button
              type='button'
              className='absolute inset-0 bg-black/45'
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label='Close mobile menu overlay'
            />
            <div className='absolute inset-y-0 left-0'>
              <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className='dashboard-surface flex min-h-0 flex-1 flex-col bg-[var(--color-page)] p-4 md:p-8'>
          <TopBar
            title={title}
            showNewBill={false}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            subtitle={subtitle}
          />
          <div className='min-h-0 flex-1 overflow-y-auto pr-1'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
