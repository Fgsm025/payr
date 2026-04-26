import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PaymentsPage from './PaymentsPage'
import { useAppStore } from '../../store/useAppStore'
import { vendors } from '../../data/mockData'

function renderPaymentsPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaymentsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    global.fetch = jest.fn((url: RequestInfo | URL) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u.includes('/payments')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 'pay-1',
                amount: 1500.5,
                paymentDate: '2026-04-20T12:00:00.000Z',
                method: 'ach',
                reference: 'REF-001',
                bill: { invoiceNumber: 'INV-X', vendor: { name: 'Stripe Test Vendor' } },
              },
            ]),
        })
      }
      if (u.includes('/vendors')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(vendors) })
      }
      return Promise.reject(new Error(`unmocked fetch: ${u}`))
    }) as jest.Mock

    useAppStore.setState({
      authToken: 'tok',
      isAuthenticated: true,
      activeWorkspaceId: 'company-x',
      bills: [],
      vendors,
    })
  })

  it('lists payments from API with method and reference', async () => {
    renderPaymentsPage()

    await waitFor(() => {
      expect(screen.getByText('Stripe Test Vendor')).toBeInTheDocument()
    })
    expect(screen.getByText('ACH')).toBeInTheDocument()
    expect(screen.getByText('REF-001')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/payments', {
      headers: { Authorization: 'Bearer tok', 'X-Entity-Id': 'company-x' },
    })
  })
})
