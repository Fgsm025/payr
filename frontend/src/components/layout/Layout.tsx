import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAppStore } from '../../store/useAppStore'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/bills': 'Bills',
  '/vendors': 'Vendors',
  '/payments': 'Payments',
  '/settings': 'Settings',
}

export default function Layout() {
  const location = useLocation()
  const theme = useAppStore((state) => state.theme)
  const title = pageTitles[location.pathname] ?? 'Payr'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className='min-h-screen px-3 py-4 md:px-3 md:py-6 lg:px-1 lg:py-7'>
      <div className='app-shell mx-auto flex min-h-[94vh] w-full max-w-[1780px] overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_18px_45px_rgba(15,23,42,0.08)]'>
        <Sidebar />
        <main className='dashboard-surface flex-1 bg-[var(--color-page)] p-7 md:p-8'>
          <TopBar title={title} showNewBill={false} />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
