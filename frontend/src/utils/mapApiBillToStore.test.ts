import { mapApiBillToStore } from './mapApiBillToStore'

describe('mapApiBillToStore', () => {
  it('maps API payload to store bill shape', () => {
    const bill = mapApiBillToStore({
      id: 'b1',
      invoiceNumber: 'INV-1',
      vendorId: 'v1',
      status: 'approved',
      invoiceDate: '2026-03-01',
      dueDate: '2026-04-01',
      totalAmount: 4200.5,
      notes: 'Quarterly',
    })
    expect(bill.id).toBe('b1')
    expect(bill.amount).toBe(4200.5)
    expect(bill.invoiceDate).toBe('2026-03-01')
    expect(bill.dueDate).toBe('2026-04-01')
    expect(bill.status).toBe('approved')
    expect(bill.notes).toBe('Quarterly')
    expect(bill.paidDate).toBeUndefined()
  })

  it('defaults unknown status to draft', () => {
    const bill = mapApiBillToStore({
      id: 'b2',
      invoiceNumber: 'INV-2',
      vendorId: 'v1',
      status: 'not_a_real_status',
      invoiceDate: '2026-01-01',
      dueDate: '2026-02-01',
      totalAmount: 100,
    })
    expect(bill.status).toBe('draft')
  })

  it('sets paidDate from history when status is paid', () => {
    const bill = mapApiBillToStore({
      id: 'b3',
      invoiceNumber: 'INV-3',
      vendorId: 'v1',
      status: 'paid',
      invoiceDate: '2026-01-01',
      dueDate: '2026-02-01',
      totalAmount: 200,
      history: [
        { status: 'draft', createdAt: '2026-01-01T00:00:00.000Z' },
        { status: 'paid', createdAt: '2026-02-15T00:00:00.000Z' },
      ],
    })
    expect(bill.paidDate).toBe('2026-02-15')
  })
})
