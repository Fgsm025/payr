export type BillStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'paid'
  | 'rejected'
  | 'archived'

export type Vendor = {
  id: string
  name: string
  email: string
  paymentTerms: number
}

export type Bill = {
  id: string
  invoiceNumber: string
  vendorId: string
  amount: number
  invoiceDate: string
  dueDate: string
  status: BillStatus
  paidDate?: string
  notes?: string
  syncStatus?: 'PENDING' | 'SUCCESS' | 'FAILED'
  /** Shown in ERP sync tooltip as QBO ref (from API `erpSyncRef`). */
  erpSyncRef?: string
  missingInfo?: boolean
  isArchived?: boolean
  lineItems?: Array<{ description: string; amount: number; category: string }>
  history?: Array<{ status: BillStatus; date: string; comment?: string; actor?: string }>
}

export const vendors: Vendor[] = [
  { id: 'ven-1', name: 'Acme Corp', email: 'ap@acmecorp.com', paymentTerms: 30 },
  { id: 'ven-2', name: 'Amazon Web Services', email: 'billing@aws.amazon.com', paymentTerms: 15 },
  { id: 'ven-3', name: 'Stripe', email: 'invoices@stripe.com', paymentTerms: 30 },
  { id: 'ven-4', name: 'Notion', email: 'billing@notion.so', paymentTerms: 30 },
  { id: 'ven-5', name: 'Figma', email: 'finance@figma.com', paymentTerms: 45 },
]

export const bills: Bill[] = [
  { id: 'bill-1', invoiceNumber: 'INV-2024-001', vendorId: 'ven-1', amount: 12000, invoiceDate: '2026-03-02', dueDate: '2026-03-30', status: 'pending_approval', history: [{ status: 'draft', date: '2026-03-02' }, { status: 'pending_approval', date: '2026-03-03' }] },
  { id: 'bill-2', invoiceNumber: 'INV-2024-002', vendorId: 'ven-2', amount: 18500, invoiceDate: '2026-02-14', dueDate: '2026-03-01', status: 'approved' },
  { id: 'bill-3', invoiceNumber: 'INV-2024-003', vendorId: 'ven-3', amount: 4200, invoiceDate: '2026-01-20', dueDate: '2026-02-15', status: 'paid', paidDate: '2026-02-16', history: [{ status: 'draft', date: '2026-01-20' }, { status: 'pending_approval', date: '2026-01-21' }, { status: 'approved', date: '2026-01-22' }, { status: 'paid', date: '2026-02-16' }] },
  {
    id: 'bill-4',
    invoiceNumber: 'INV-2024-004',
    vendorId: 'ven-4',
    amount: 980,
    invoiceDate: '2026-04-03',
    dueDate: '2026-05-03',
    status: 'draft',
    history: [{ status: 'draft', date: '2026-04-03' }],
    lineItems: [{ description: 'Notion workspace', amount: 980, category: 'Software' }],
  },
  { id: 'bill-5', invoiceNumber: 'INV-2024-005', vendorId: 'ven-5', amount: 25000, invoiceDate: '2026-02-28', dueDate: '2026-03-20', status: 'scheduled' },
  { id: 'bill-6', invoiceNumber: 'INV-2024-006', vendorId: 'ven-1', amount: 7600, invoiceDate: '2026-01-08', dueDate: '2026-02-08', status: 'rejected' },
  { id: 'bill-7', invoiceNumber: 'INV-2024-007', vendorId: 'ven-2', amount: 15300, invoiceDate: '2026-03-10', dueDate: '2026-04-10', status: 'pending_approval' },
  { id: 'bill-8', invoiceNumber: 'INV-2024-008', vendorId: 'ven-3', amount: 5400, invoiceDate: '2026-04-01', dueDate: '2026-04-20', status: 'approved' },
  { id: 'bill-9', invoiceNumber: 'INV-2024-009', vendorId: 'ven-4', amount: 1320, invoiceDate: '2026-02-05', dueDate: '2026-02-28', status: 'paid', paidDate: '2026-04-02' },
  { id: 'bill-10', invoiceNumber: 'INV-2024-010', vendorId: 'ven-5', amount: 8900, invoiceDate: '2026-03-22', dueDate: '2026-04-22', status: 'scheduled' },
  { id: 'bill-11', invoiceNumber: 'INV-2024-011', vendorId: 'ven-1', amount: 620, invoiceDate: '2026-04-05', dueDate: '2026-04-25', status: 'draft' },
  { id: 'bill-12', invoiceNumber: 'INV-2024-012', vendorId: 'ven-2', amount: 21000, invoiceDate: '2026-01-15', dueDate: '2026-02-01', status: 'paid', paidDate: '2026-02-04' },
  { id: 'bill-13', invoiceNumber: 'INV-2024-013', vendorId: 'ven-3', amount: 3300, invoiceDate: '2025-11-30', dueDate: '2025-12-30', status: 'archived' },
  { id: 'bill-14', invoiceNumber: 'INV-2024-014', vendorId: 'ven-4', amount: 2700, invoiceDate: '2026-01-28', dueDate: '2026-02-20', status: 'approved' },
  { id: 'bill-15', invoiceNumber: 'INV-2024-015', vendorId: 'ven-5', amount: 14500, invoiceDate: '2026-03-18', dueDate: '2026-04-01', status: 'pending_approval' },
]
