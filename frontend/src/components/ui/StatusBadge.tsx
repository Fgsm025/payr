import type { BillStatus } from '../../data/mockData'

type BadgeStatus = BillStatus | 'overdue'

const statusStyles: Record<BadgeStatus, string> = {
  draft: 'bg-gray-100 text-[var(--color-draft)]',
  pending_approval: 'bg-amber-100 text-[var(--color-warning)]',
  approved: 'bg-indigo-100 text-[var(--color-primary)]',
  scheduled: 'bg-blue-100 text-blue-600',
  paid: 'bg-emerald-100 text-[var(--color-success)]',
  rejected: 'bg-red-100 text-[var(--color-danger)]',
  archived: 'bg-slate-200 text-slate-600',
  overdue: 'bg-red-100 text-[var(--color-danger)]',
}

const statusLabels: Record<BadgeStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  paid: 'Paid',
  rejected: 'Rejected',
  archived: 'Archived',
  overdue: 'Overdue',
}

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>{statusLabels[status]}</span>
}
