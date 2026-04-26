import { act } from '@testing-library/react'
import { useAppStore } from './useAppStore'
import { vendors } from '../data/mockData'
import type { Bill } from '../data/mockData'
import { queryClient } from '@/lib/queryClient'
import { fetchBillsApi } from '@/lib/workspaceApi'

const draftBill: Bill = {
  id: 'flow-test-1',
  invoiceNumber: 'INV-FLOW-1',
  vendorId: 'ven-1',
  amount: 250,
  invoiceDate: '2026-01-10',
  dueDate: '2026-02-10',
  status: 'draft',
  history: [{ status: 'draft', date: '2026-01-10T00:00:00.000Z' }],
}

describe('bill flows (store)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({
      bills: [draftBill],
      vendors,
      authToken: null,
      isAuthenticated: false,
    })
  })

  it('local submit moves draft to pending_approval', async () => {
    await act(async () => {
      await useAppStore.getState().transitionBill('flow-test-1', 'submit', 'please review')
    })
    const b = useAppStore.getState().bills.find((x) => x.id === 'flow-test-1')
    expect(b?.status).toBe('pending_approval')
    expect(b?.history?.some((h) => h.status === 'pending_approval')).toBe(true)
  })

  it('local approve then pay reaches paid with paidDate', async () => {
    await act(async () => {
      await useAppStore.getState().transitionBill('flow-test-1', 'submit')
    })
    await act(async () => {
      await useAppStore.getState().transitionBill('flow-test-1', 'approve')
    })
    await act(async () => {
      await useAppStore.getState().transitionBill('flow-test-1', 'pay', 'via ach')
    })
    const b = useAppStore.getState().bills.find((x) => x.id === 'flow-test-1')
    expect(b?.status).toBe('paid')
    expect(b?.paidDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('invalid transition leaves bill unchanged', async () => {
    await act(async () => {
      await useAppStore.getState().transitionBill('flow-test-1', 'pay')
    })
    expect(useAppStore.getState().bills.find((x) => x.id === 'flow-test-1')?.status).toBe('draft')
  })

  it('uses API when PATCH succeeds', async () => {
    const updatedFromApi = {
      id: 'flow-test-1',
      invoiceNumber: 'INV-FLOW-1',
      vendorId: 'ven-1',
      status: 'pending_approval',
      invoiceDate: '2026-01-10',
      dueDate: '2026-02-10',
      totalAmount: 250,
      history: [
        { status: 'draft', createdAt: '2026-01-10T00:00:00.000Z' },
        { status: 'pending_approval', createdAt: '2026-01-11T00:00:00.000Z' },
      ],
    }
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(updatedFromApi),
      }),
    ) as jest.Mock

    const invSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined as never)

    useAppStore.setState({ authToken: 'fake-jwt', isAuthenticated: true })
    await act(async () => {
      await useAppStore.getState().transitionBill('flow-test-1', 'submit')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/bills/flow-test-1/status',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'X-Entity-Id': 'xyz-ar',
        }),
      }),
    )
    expect(invSpy).toHaveBeenCalledWith({ queryKey: ['workspace', 'xyz-ar'] })
    expect(useAppStore.getState().bills.find((b) => b.id === 'flow-test-1')?.status).toBe('draft')
    invSpy.mockRestore()
  })

  it('fetchBillsApi loads bills from GET /bills', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              id: 'api-1',
              invoiceNumber: 'INV-A1',
              vendorId: 'ven-1',
              status: 'draft',
              invoiceDate: '2026-01-01',
              dueDate: '2026-02-01',
              totalAmount: 100,
            },
          ]),
      }),
    ) as jest.Mock

    const list = await fetchBillsApi('t', 'xyz-ar')

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/bills',
      expect.objectContaining({
        headers: { Authorization: 'Bearer t', 'X-Entity-Id': 'xyz-ar' },
      }),
    )
    expect(list.some((b) => b.id === 'api-1')).toBe(true)
  })
})
