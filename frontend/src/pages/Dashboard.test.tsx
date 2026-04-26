import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './Dashboard'
import { useAppStore } from '../store/useAppStore'
import { vendors } from '../data/mockData'

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    global.fetch = jest.fn((url: RequestInfo | URL) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u.includes('/dashboard/summary')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              totalPayable: 1000,
              pendingApproval: 2,
              overdue: 1,
              paidThisMonth: 500,
            }),
        })
      }
      if (u.includes('/dashboard/ap-aging')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                vendor: 'Acme Corp',
                current: 100,
                bucket_0_30: 200,
                bucket_31_60: 0,
                bucket_61_90: 0,
                bucket_90_plus: 0,
                total: 300,
              },
            ]),
        })
      }
      if (u.includes('/bills')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      if (u.includes('/vendors')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(vendors) })
      }
      return Promise.reject(new Error(`unmocked fetch: ${u}`))
    }) as jest.Mock

    useAppStore.setState({
      authToken: 'token',
      isAuthenticated: true,
      activeWorkspaceId: 'xyz-ar',
      bills: [],
      vendors,
    })
  })

  it('loads summary and AP aging from API', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })

    const pendingSection = screen.getByText('Pending Approval').closest('div')?.parentElement
    expect(pendingSection && within(pendingSection).getByText('2')).toBeTruthy()

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Current' })).toBeInTheDocument()
    })
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })
})
