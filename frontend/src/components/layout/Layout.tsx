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
  const snack = useAppStore((state) => state.snack)
  const clearSnack = useAppStore((state) => state.clearSnack)
  const { t } = useI18n()
  const title = t(pageTitleKeys[location.pathname] ?? 'page.default')
  const subtitle = location.pathname === '/payments' ? 'Completed bill payments.' : undefined
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const snackToneClasses: Record<'success' | 'error' | 'info', string> = {
    success: 'border-emerald-200 bg-emerald-50/95 text-emerald-700',
    error: 'border-rose-200 bg-rose-50/95 text-rose-700',
    info: 'border-sky-200 bg-sky-50/95 text-sky-700',
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!snack) return
    const timer = globalThis.setTimeout(() => clearSnack(), 3200)
    return () => globalThis.clearTimeout(timer)
  }, [snack, clearSnack])

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
          <div className='app-main-scroll min-h-0 flex-1 overflow-y-auto pr-1'>
            <Outlet />
          </div>
        </main>
        {snack ? (
          <div className='pointer-events-none absolute bottom-4 right-4 z-50'>
            <div
              key={snack.id}
              className={`min-w-[260px] rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${snackToneClasses[snack.tone]}`}
            >
              {snack.message}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
