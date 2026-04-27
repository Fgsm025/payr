import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
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
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)

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
      navigate('/bills?tab=drafts', { replace: true })
    }
  }

  const actionButtons = {
    draft: (
      <>
        <Button variant="success" onClick={() => setIsSubmitConfirmOpen(true)}>
          {hasRejectedHistory ? t('bills.submit.confirm.resubmitCta') : t('bills.submit.confirm.submitCta')}
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
        <Button variant="success" onClick={() => setIsSubmitConfirmOpen(true)}>
          {t('bills.submit.confirm.submitCta')}
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
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const primary = [59, 130, 246] as const
    const slate900 = [15, 23, 42] as const
    const slate700 = [51, 65, 85] as const
    const slate500 = [100, 116, 139] as const
    const lineColor = [226, 232, 240] as const
    const money = (amount: number) => `$${amount.toLocaleString()}`
    const statusLabel = t(`status.${bill.status}`)

    doc.setFillColor(0, 0, 0)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    const logoX = 14
    const logoY = 12
    const logoPrefix = 'pay'
    doc.text(logoPrefix, logoX, logoY)
    const logoPrefixWidth = doc.getTextWidth(logoPrefix)
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.text('r.', logoX + logoPrefixWidth, logoY)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Accounts Payable Workspace', 14, 18)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('INVOICE', pageW - 14, 12, { align: 'right' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice # ${bill.invoiceNumber}`, pageW - 14, 18, { align: 'right' })

    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2])
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 36, 88, 34, 2, 2, 'FD')
    doc.roundedRect(pageW - 102, 36, 88, 34, 2, 2, 'FD')

    doc.setTextColor(slate500[0], slate500[1], slate500[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('BILL TO', 18, 43)
    doc.text('INVOICE DETAILS', pageW - 98, 43)

    doc.setTextColor(slate900[0], slate900[1], slate900[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(vendor?.name ?? 'Unknown vendor', 18, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(vendor?.email ?? 'No email available', 18, 56)
    doc.text(`Payment terms: ${vendor?.paymentTerms ?? 30} days`, 18, 62)

    doc.setTextColor(slate700[0], slate700[1], slate700[2])
    doc.text(`Invoice date: ${bill.invoiceDate}`, pageW - 98, 50)
    doc.text(`Due date: ${bill.dueDate}`, pageW - 98, 56)
    doc.text(`Status: ${statusLabel}`, pageW - 98, 62)

    const startY = 80
    doc.setFillColor(241, 245, 249)
    doc.rect(14, startY, pageW - 28, 9, 'F')
    doc.setTextColor(slate500[0], slate500[1], slate500[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('DESCRIPTION', 18, startY + 6)
    doc.text('AMOUNT', pageW - 18, startY + 6, { align: 'right' })

    let y = startY + 14
    const items = lineItems.length
      ? lineItems
      : [{ description: bill.notes?.trim() || 'Invoice total', amount: bill.amount }]

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(slate900[0], slate900[1], slate900[2])
    for (const row of items) {
      if (y > pageH - 40) {
        doc.addPage()
        y = 20
      }
      doc.text(String(row.description), 18, y)
      doc.text(money(row.amount), pageW - 18, y, { align: 'right' })
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2])
      doc.line(14, y + 3, pageW - 14, y + 3)
      y += 10
    }

    const totalBoxY = Math.min(y + 4, pageH - 30)
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(pageW - 84, totalBoxY, 70, 16, 2, 2, 'F')
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('TOTAL DUE', pageW - 78, totalBoxY + 6)
    doc.setFontSize(13)
    doc.text(money(bill.amount), pageW - 18, totalBoxY + 12, { align: 'right' })

    doc.setTextColor(slate500[0], slate500[1], slate500[2])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Generated by payr', 14, pageH - 10)
    doc.text(new Date().toLocaleString(), pageW - 14, pageH - 10, { align: 'right' })
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
      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        title={t('bills.submit.confirm.title')}
        description={t('bills.submit.confirm.body')}
        confirmLabel={hasRejectedHistory ? t('bills.submit.confirm.resubmitCta') : t('bills.submit.confirm.submitCta')}
        cancelLabel={t('bills.submit.confirm.cancel')}
        confirmVariant="primary"
        onConfirm={() => {
          setIsSubmitConfirmOpen(false)
          void onSubmitForApproval()
        }}
        onCancel={() => setIsSubmitConfirmOpen(false)}
      />
    </div>
  )
}
