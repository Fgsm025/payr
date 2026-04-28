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
  syncStatus?: 'PENDING' | 'SUCCESS' | 'FAILED'
  erpSyncRef?: string | null
  missingInfo?: boolean
  isArchived?: boolean
  lineItems?: ApiLineItem[]
  history?: ApiHistoryEntry[]
}

type ApiHistoryEntry = {
  status: string
  comment?: string | null
  createdAt?: string
}

function splitActorAndComment(raw: string | null | undefined): { actor?: string; comment?: string } {
  if (!raw) return {}
  const m = /^\[by:([^\]]+)\]\s*(.*)$/i.exec(raw.trim())
  if (!m) return { comment: raw }
  return {
    actor: m[1],
    comment: m[2] || undefined,
  }
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
      const parsed = splitActorAndComment(h.comment ?? undefined)
      return {
        status: st,
        date: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString(),
        comment: parsed.comment,
        actor: parsed.actor,
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
    syncStatus: raw.syncStatus ?? 'PENDING',
    erpSyncRef: raw.erpSyncRef ?? undefined,
    missingInfo: Boolean(raw.missingInfo),
    isArchived: Boolean(raw.isArchived),
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
