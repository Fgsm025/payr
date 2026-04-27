import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Download } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmPaymentModal from './ConfirmPaymentModal'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAppStore } from '../../store/useAppStore'
import type { Bill } from '../../data/mockData'
import { useWorkspaceBillQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'
import { useTranslation } from '../../i18n/useI18n'

function formatTimelineDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function buildTimeline(bill: Bill) {
  const entries = [...(bill.history ?? [])]
  if (!entries.some((e) => e.status === 'draft')) {
    entries.unshift({ status: 'draft', date: new Date(bill.invoiceDate).toISOString() })
  }
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (!entries.some((e) => e.status === bill.status)) {
    const fallbackDate =
      bill.status === 'paid' && bill.paidDate
        ? new Date(bill.paidDate).toISOString()
        : new Date(bill.dueDate).toISOString()
    entries.push({
      status: bill.status,
      date: fallbackDate,
      comment: 'Inferred from current status',
    })
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return entries
}

function prettifyStatus(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeTimelineComment(comment: string | undefined, t: (key: string) => string): string | null {
  if (!comment) return null
  if (comment === 'Inferred from current status') return null
  const match = /^Status:\s*([a-z_]+)$/i.exec(comment.trim())
  if (match) return `${t('bills.table.status')}: ${prettifyStatus(match[1])}`
  return comment
}

function BillDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-28 rounded-xl bg-slate-100" />
            <div className="h-28 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="h-40 rounded-2xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

export default function BillDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const billQuery = useWorkspaceBillQuery(id)
  const vendorsQuery = useWorkspaceVendorsQuery()
  const vendors = vendorsQuery.data ?? []
  const bill = useMemo(() => (billQuery.data ? mapApiBillToStore(billQuery.data) : undefined), [billQuery.data])
  const transitionBill = useAppStore((state) => state.transitionBill)
  const paymentMethods = useAppStore((state) => state.paymentMethods)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isSubmitSuccessOpen, setIsSubmitSuccessOpen] = useState(false)

  const timeline = useMemo(() => (bill ? buildTimeline(bill) : []), [bill])

  if (!id) return <Navigate to="/bills" replace />
  if (billQuery.isError) return <Navigate to="/bills" replace />
  if (billQuery.isPending && !bill) return <BillDetailSkeleton />
  if (!bill) return <Navigate to="/bills" replace />

  const vendor = vendors.find((item) => item.id === bill.vendorId)
  const lineItems = bill.lineItems ?? []
  const hasRejectedHistory = (bill.history ?? []).some((entry) => entry.status === 'rejected')

  const onSubmitForApproval = async () => {
    const ok = await transitionBill(bill.id, 'submit')
    if (ok) {
      setIsSubmitSuccessOpen(true)
    }
  }

  const actionButtons = {
    draft: (
      <>
        <Button variant="success" onClick={() => void onSubmitForApproval()}>
          {hasRejectedHistory ? 'Resubmit for Approval' : 'Submit for Approval'}
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/bills/${bill.id}/edit`)}>
          {t('bills.action.edit')}
        </Button>
      </>
    ),
    pending_approval: (
      <>
        <Button variant="success" onClick={() => setIsApproveModalOpen(true)}>
          Approve
        </Button>
        <Button variant="danger" onClick={() => setIsRejectModalOpen(true)}>
          Reject
        </Button>
      </>
    ),
    approved: (
      <Button variant="success" onClick={() => setIsPayModalOpen(true)}>
        Pay Bill
      </Button>
    ),
    scheduled: (
      <Button variant="success" onClick={() => setIsPayModalOpen(true)}>
        Pay Bill
      </Button>
    ),
    paid: (
      <Button variant="primary" onClick={() => navigate('/bills?tab=history')}>
        History
      </Button>
    ),
    rejected: (
      <>
        <Button variant="success" onClick={() => void onSubmitForApproval()}>
          Submit for Approval
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/bills/${bill.id}/edit`)}>
          {t('bills.action.edit')}
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await transitionBill(bill.id, 'archive')
          }}
        >
          Archive
        </Button>
      </>
    ),
  } as const

  const onDownloadPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let y = 16
    doc.setFontSize(16)
    doc.text(bill.invoiceNumber, 14, y)
    y += 8
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(vendor?.name ?? 'Vendor', 14, y)
    y += 10
    doc.setTextColor(0, 0, 0)
    doc.text(`Amount: $${bill.amount.toLocaleString()}`, 14, y)
    y += 6
    doc.text(`Invoice date: ${bill.invoiceDate}`, 14, y)
    y += 6
    doc.text(`Due date: ${bill.dueDate}`, 14, y)
    y += 6
    doc.text(`Status: ${bill.status}`, 14, y)
    y += 8
    if (bill.notes) {
      doc.setFontSize(10)
      doc.text(`Notes: ${bill.notes}`, 14, y)
      y += 8
    }
    if (lineItems.length) {
      doc.setFontSize(12)
      doc.text('Line items', 14, y)
      y += 6
      doc.setFontSize(10)
      for (const row of lineItems) {
        doc.text(`${row.description}`, 14, y)
        doc.text(`$${row.amount.toLocaleString()}`, 150, y)
        y += 5
        if (y > 270) {
          doc.addPage()
          y = 16
        }
      }
    }
    doc.save(`${bill.invoiceNumber}.pdf`)
  }

  const onConfirmPayment = async ({
    paymentMethodId,
    scheduledDate,
  }: {
    paymentMethodId: string
    scheduledDate: string
  }) => {
    const ok = await transitionBill(
      bill.id,
      'pay',
      t('bills.payComment', { date: scheduledDate, method: paymentMethodId }),
    )
    if (!ok) return
  }

  return (
    <div
      className={`space-y-4${billQuery.isFetching && billQuery.data ? ' opacity-60 transition-opacity duration-200' : ''}`}
    >
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-900">{bill.invoiceNumber}</h3>
              <StatusBadge status={bill.status} />
            </div>
            <p className="mt-1 text-base font-medium text-slate-700">{vendor?.name ?? 'Unknown vendor'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="inline-flex items-center gap-2 whitespace-nowrap" onClick={onDownloadPdf}>
              <Download size={16} />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm">
              <span className="font-semibold text-slate-800">Amount</span>
              <span className="mt-0.5 block text-lg font-bold text-slate-900">${bill.amount.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-slate-800">Due</span>
              <span className="mt-0.5 block text-slate-700">{bill.dueDate}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-slate-800">Notes</span>
              <span className="mt-0.5 block text-slate-600">{bill.notes?.trim() ? bill.notes : '—'}</span>
            </p>
          </div>
          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm">
              <span className="font-semibold text-slate-800">Invoice</span>
              <span className="mt-0.5 block text-slate-700">{bill.invoiceDate}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-slate-800">Vendor</span>
              <span className="mt-0.5 block text-slate-700">{vendor?.name ?? '—'}</span>
            </p>
          </div>
        </div>

        {lineItems.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-2 text-sm font-semibold text-slate-900">Line Items</h4>
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-surface)] text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((row, index) => (
                    <tr
                      key={`${row.description}-${index}`}
                      className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <td className="px-4 py-2.5 text-slate-800">{row.description}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-900">${row.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-5">
          {actionButtons[bill.status as keyof typeof actionButtons] ?? null}
          <Button variant="secondary" onClick={() => navigate('/bills')}>
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <h4 className="mb-4 text-sm font-semibold text-slate-900">Status Timeline</h4>
        <div className="space-y-3">
          {timeline.map((entry, index) => (
            <div
              key={`${entry.status}-${index}`}
              className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
            >
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{t(`status.${entry.status}`)}</p>
                <p className="text-xs text-slate-500">{formatTimelineDate(entry.date)}</p>
                {entry.actor ? <p className="mt-1 text-xs text-slate-500">By {entry.actor}</p> : null}
                {normalizeTimelineComment(entry.comment, t) ? (
                  <p className="mt-1 text-xs text-slate-600">{normalizeTimelineComment(entry.comment, t)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal
        title={t('bills.approve.title')}
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{t('bills.approve.body')}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsApproveModalOpen(false)}>
              {t('bills.approve.cancel')}
            </Button>
            <Button
              type="button"
              variant="success"
              onClick={async () => {
                const ok = await transitionBill(bill.id, 'approve')
                if (!ok) return
                setIsApproveModalOpen(false)
                navigate('/bills?tab=for_approval', { replace: true })
              }}
            >
              {t('bills.approve.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        title={t('bills.reject.title')}
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false)
          setRejectComment('')
        }}
      >
        <div className="space-y-4">
          <textarea
            value={rejectComment}
            onChange={(event) => setRejectComment(event.target.value)}
            placeholder={t('bills.reject.placeholder')}
            rows={4}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsRejectModalOpen(false)
                setRejectComment('')
              }}
            >
              {t('bills.reject.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                await transitionBill(bill.id, 'reject', rejectComment.trim())
                setIsRejectModalOpen(false)
                setRejectComment('')
              }}
            >
              {t('bills.reject.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmPaymentModal
        isOpen={isPayModalOpen}
        amount={bill.amount}
        dueDate={bill.dueDate}
        paymentMethods={paymentMethods}
        onClose={() => setIsPayModalOpen(false)}
        onConfirm={onConfirmPayment}
      />
      <Modal title=" " isOpen={isSubmitSuccessOpen} onClose={() => {}}>
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <CheckCircle2 size={58} className="text-emerald-500" />
          <p className="text-xl font-semibold text-slate-900">{t('bills.submit.successTitle')}</p>
          <p className="max-w-sm text-sm text-slate-500">{t('bills.submit.successBody')}</p>
          <Button
            type="button"
            className="mt-2"
            onClick={() => {
              setIsSubmitSuccessOpen(false)
              navigate('/bills?tab=drafts', { replace: true })
            }}
          >
            {t('bills.submit.successBack')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
