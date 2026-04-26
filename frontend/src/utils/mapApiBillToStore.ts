import type { Bill, BillStatus } from '../data/mockData'

export type ApiBillPayload = {
  id: string
  invoiceNumber: string
  vendorId: string
  status: string
  invoiceDate: string | Date
  dueDate: string | Date
  totalAmount: number
  notes?: string | null
  lineItems?: ApiLineItem[]
  history?: ApiHistoryEntry[]
}

type ApiHistoryEntry = {
  status: string
  comment?: string | null
  createdAt?: string
}

type ApiLineItem = {
  description: string
  amount: number
  category: string
}

function toYmd(value: string | Date | undefined): string {
  if (!value) return ''
  const s = typeof value === 'string' ? value : value.toISOString()
  return s.slice(0, 10)
}

function isBillStatus(s: string): s is BillStatus {
  return (
    s === 'draft' ||
    s === 'pending_approval' ||
    s === 'approved' ||
    s === 'scheduled' ||
    s === 'paid' ||
    s === 'rejected' ||
    s === 'archived'
  )
}

export function mapApiBillToStore(raw: ApiBillPayload): Bill {
  const status: BillStatus = isBillStatus(raw.status) ? raw.status : 'draft'

  const historyFromApi =
    raw.history?.map((h) => {
      const st = isBillStatus(h.status) ? h.status : 'draft'
      return {
        status: st,
        date: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString(),
        comment: h.comment ?? undefined,
      }
    }) ?? []

  const paidEntry = [...historyFromApi].reverse().find((h) => h.status === 'paid')

  return {
    id: raw.id,
    invoiceNumber: raw.invoiceNumber,
    vendorId: raw.vendorId,
    amount: raw.totalAmount,
    invoiceDate: toYmd(raw.invoiceDate),
    dueDate: toYmd(raw.dueDate),
    status,
    paidDate: status === 'paid' ? toYmd(paidEntry?.date) || undefined : undefined,
    notes: raw.notes ?? undefined,
    lineItems:
      raw.lineItems && raw.lineItems.length > 0
        ? raw.lineItems.map((li) => ({
            description: li.description,
            amount: li.amount,
            category: li.category,
          }))
        : undefined,
    history: historyFromApi.length
      ? historyFromApi
      : [{ status: 'draft' as const, date: new Date(toYmd(raw.invoiceDate) || Date.now()).toISOString() }],
  }
}
