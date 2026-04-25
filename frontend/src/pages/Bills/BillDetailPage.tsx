import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAppStore } from '../../store/useAppStore'
import type { BillStatus } from '../../data/mockData'

const statusLabel: Record<BillStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  paid: 'Paid',
  rejected: 'Rejected',
  archived: 'Archived',
}

export default function BillDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bill = useAppStore((state) => state.bills.find((item) => item.id === id))
  const vendors = useAppStore((state) => state.vendors)
  const transitionBill = useAppStore((state) => state.transitionBill)

  if (!bill) return <Navigate to="/bills" replace />

  const vendor = vendors.find((item) => item.id === bill.vendorId)
  const actionButtons = {
    draft: (
      <>
        <Button variant="success" onClick={() => transitionBill(bill.id, 'submit')}>Submit for Approval</Button>
        <Button variant="secondary" onClick={() => transitionBill(bill.id, 'archive')}>Archive</Button>
      </>
    ),
    pending_approval: (
      <>
        <Button variant="success" onClick={() => transitionBill(bill.id, 'approve')}>Approve</Button>
        <Button variant="danger" onClick={() => transitionBill(bill.id, 'reject', 'Rejected from detail view')}>Reject</Button>
        <Button variant="secondary" onClick={() => transitionBill(bill.id, 'archive')}>Archive</Button>
      </>
    ),
    approved: (
      <>
        <Button variant="success" onClick={() => transitionBill(bill.id, 'pay')}>Mark as Paid</Button>
        <Button variant="secondary" onClick={() => transitionBill(bill.id, 'archive')}>Archive</Button>
      </>
    ),
  } as const

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{bill.invoiceNumber}</h3>
            <p className="mt-1 text-sm text-slate-500">{vendor?.name}</p>
          </div>
          <StatusBadge status={bill.status} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <p><span className="font-semibold">Amount:</span> ${bill.amount.toLocaleString()}</p>
          <p><span className="font-semibold">Invoice Date:</span> {bill.invoiceDate}</p>
          <p><span className="font-semibold">Due Date:</span> {bill.dueDate}</p>
          <p><span className="font-semibold">Vendor:</span> {vendor?.name}</p>
          <p className="md:col-span-2"><span className="font-semibold">Notes:</span> {bill.notes || 'No notes'}</p>
        </div>

        <div className="mt-6 flex gap-2">
          {actionButtons[bill.status as keyof typeof actionButtons] ?? null}
          <Button variant="secondary" onClick={() => navigate('/bills')}>Back</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h4 className="mb-4 text-lg font-semibold text-slate-900">Status Timeline</h4>
        <div className="space-y-3">
          {(bill.history ?? [{ status: 'draft', date: bill.invoiceDate }]).map((entry, index) => (
            <div key={`${entry.status}-${index}`} className="flex gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{statusLabel[entry.status]}</p>
                <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleString()}</p>
                {entry.comment && <p className="text-xs text-slate-500">{entry.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
