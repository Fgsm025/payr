import { useMemo, useState } from 'react'
import { Archive, Eye, Trash2 } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import type { Bill, BillStatus } from '../../data/mockData'
import { useTranslation } from '../../i18n/useI18n'
import { useAppStore } from '../../store/useAppStore'
import { renderErpSyncCell } from './erpSyncCell'

type BillRow = Bill & { vendorName: string; displayStatus: BillStatus | 'overdue'; rejectionReason?: string }

type BillsTableProps = {
  bills: BillRow[]
  activeTab: string
  onAction: (
    billId: string,
    action: 'submit' | 'approve' | 'reject' | 'pay' | 'archive' | 'restore' | 'delete',
  ) => void
  onView: (billId: string) => void
  onBulkAction: (billIds: string[], action: 'approve' | 'pay') => Promise<void>
}

export default function BillsTable({
  bills,
  activeTab,
  onAction,
  onView,
  onBulkAction,
}: Readonly<BillsTableProps>) {
  const { t } = useTranslation()
  const showErpSyncColumn = useAppStore((s) => s.erpAutoSyncEnabled)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkSnapshot, setBulkSnapshot] = useState<null | { action: 'approve' | 'pay'; billIds: string[] }>(null)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [restoreBillId, setRestoreBillId] = useState<string | null>(null)
  const [archiveBillId, setArchiveBillId] = useState<string | null>(null)
  const [deleteBillId, setDeleteBillId] = useState<string | null>(null)

  const selectable = activeTab === 'for_approval' || activeTab === 'for_payment'
  const selectedCount = selectedIds.length

  const selectedRows = useMemo(
    () => bills.filter((b) => selectedIds.includes(b.id)),
    [bills, selectedIds],
  )
  const modalRows = useMemo(
    () =>
      bulkSnapshot ? bills.filter((b) => bulkSnapshot.billIds.includes(b.id)) : [],
    [bills, bulkSnapshot],
  )
  const snapshotCount = bulkSnapshot?.billIds.length ?? 0
  const bulkTotal = useMemo(
    () => (bulkSnapshot != null ? modalRows : selectedRows).reduce((sum, b) => sum + b.amount, 0),
    [bulkSnapshot, modalRows, selectedRows],
  )
  const formatMoney = (n: number) => `$${n.toLocaleString()}`

  const toggleSelection = (billId: string) => {
    setSelectedIds((prev) =>
      prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId],
    )
  }

  const clearSelection = () => setSelectedIds([])

  const renderActions = (row: BillRow) => {
    if (activeTab === 'drafts') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.view')}
          </Button>
          <button
            type="button"
            onClick={() => setArchiveBillId(row.id)}
            className="cursor-pointer rounded-lg border border-[var(--color-border)] p-1.5 text-slate-500 transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
            aria-label={t('bills.action.archive')}
            title={t('bills.action.archive')}
          >
            <Archive size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteBillId(row.id)}
            disabled={row.status !== 'draft'}
            className="cursor-pointer rounded-lg border border-[var(--color-border)] p-1.5 text-slate-500 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--color-border)] disabled:hover:bg-transparent disabled:hover:text-slate-500"
            aria-label={t('bills.action.delete')}
            title={row.status === 'draft' ? t('bills.action.delete') : 'Only draft bills can be deleted'}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
    if (activeTab === 'for_approval') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.review')}
          </Button>
        </div>
      )
    }
    if (activeTab === 'for_payment') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.review')}
          </Button>
        </div>
      )
    }
    if (activeTab === 'archived') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => setRestoreBillId(row.id)}>
            {t('bills.action.restore')}
          </Button>
          <button
            type="button"
            onClick={() => onView(row.id)}
            className="cursor-pointer rounded-lg border border-[var(--color-border)] p-1.5 text-slate-500 transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
            aria-label={t('bills.action.view')}
            title={t('bills.action.view')}
          >
            <Eye size={15} />
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => onView(row.id)}>
          {t('bills.action.view')}
        </Button>
      </div>
    )
  }

  const columns = useMemo(() => {
    const syncColumn = {
      key: 'sync',
      label: t('bills.table.sync'),
      render: (row: BillRow) => renderErpSyncCell(row, t),
    }

    return [
      {
        key: 'select',
        label: '',
        render: (row: BillRow) =>
          selectable ? (
            <input
              type="checkbox"
              checked={selectedIds.includes(row.id)}
              onChange={() => toggleSelection(row.id)}
              aria-label={`Select ${row.invoiceNumber}`}
            />
          ) : null,
      },
      {
        key: 'invoiceNumber',
        label: t('bills.table.invoiceNumber'),
        sortable: true,
        render: (row: BillRow) => (
          <div>
            <div className="flex items-center gap-2">
              <p>{row.invoiceNumber}</p>
              {activeTab === 'drafts' && row.missingInfo ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Missing Info
                </span>
              ) : null}
            </div>
            {row.status === 'rejected' && row.rejectionReason ? (
              <p
                className="mt-0.5 max-w-[240px] truncate text-xs text-red-600"
                title={`${t('bills.reject.reasonPrefix')}: ${row.rejectionReason}`}
              >
                {t('bills.reject.reasonPrefix')}: {row.rejectionReason}
              </p>
            ) : null}
          </div>
        ),
      },
      { key: 'vendorName', label: t('bills.table.vendor'), sortable: true },
      {
        key: 'amount',
        label: t('bills.table.amount'),
        sortable: true,
        render: (row: BillRow) => `$${row.amount.toLocaleString()}`,
      },
      { key: 'invoiceDate', label: t('bills.table.invoiceDate'), sortable: true },
      { key: 'dueDate', label: t('bills.table.dueDate'), sortable: true },
      ...(showErpSyncColumn ? [syncColumn] : []),
      {
        key: 'status',
        label: t('bills.table.status'),
        render: (row: BillRow) => (
          <div
            title={
              row.status === 'rejected' && row.rejectionReason
                ? `${t('bills.reject.reasonPrefix')}: ${row.rejectionReason}`
                : undefined
            }
          >
            <StatusBadge status={row.displayStatus} />
          </div>
        ),
      },
      {
        key: 'actions',
        label: t('bills.table.actions'),
        render: (row: BillRow) => renderActions(row),
      },
    ]
  }, [t, activeTab, selectable, selectedIds, showErpSyncColumn])

  return (
    <div className="space-y-3">
      <DataTable columns={columns} data={bills} rowKey={(row) => row.id} />
      {selectedCount > 0 && selectable ? (
        <div className="sticky bottom-3 z-10 flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-slate-800">
            {t('bills.bulk.selectedBar', { count: selectedCount })}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={clearSelection}>
              {t('bills.bulk.clear')}
            </Button>
            {activeTab === 'for_approval' ? (
              <Button
                size="sm"
                onClick={() => {
                  if (selectedIds.length === 0) return
                  setBulkSnapshot({ action: 'approve', billIds: [...selectedIds] })
                }}
              >
                {t('bills.bulk.approveOpen')}
              </Button>
            ) : null}
            {activeTab === 'for_payment' ? (
              <Button
                size="sm"
                onClick={() => {
                  if (selectedIds.length === 0) return
                  setBulkSnapshot({ action: 'pay', billIds: [...selectedIds] })
                }}
              >
                {t('bills.bulk.payOpen')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Modal
        title={
          bulkSnapshot?.action === 'pay'
            ? t('bills.bulk.confirmPayTitle')
            : t('bills.bulk.confirmApproveTitle')
        }
        isOpen={bulkSnapshot != null}
        onClose={() => {
          if (!bulkSubmitting) setBulkSnapshot(null)
        }}
        panelClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{t('bills.bulk.reviewHint')}</p>
          <p className="text-sm font-medium text-slate-800">
            {t('bills.bulk.selectedBar', { count: snapshotCount })} — {t('bills.bulk.total')}{' '}
            <span className="text-slate-900">{formatMoney(bulkTotal)}</span>
          </p>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">{t('bills.table.invoiceNumber')}</th>
                  <th className="px-3 py-2">{t('bills.table.vendor')}</th>
                  <th className="px-3 py-2 text-right">{t('bills.table.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {modalRows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 font-medium text-slate-900">{row.invoiceNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{row.vendorName}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                      {formatMoney(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBulkSnapshot(null)}
              disabled={bulkSubmitting}
            >
              {t('bills.bulk.cancel')}
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!bulkSnapshot) return
                setBulkSubmitting(true)
                try {
                  await onBulkAction(bulkSnapshot.billIds, bulkSnapshot.action)
                  clearSelection()
                  setBulkSnapshot(null)
                } finally {
                  setBulkSubmitting(false)
                }
              }}
              disabled={bulkSubmitting || snapshotCount === 0}
            >
              {bulkSnapshot?.action === 'pay'
                ? t('bills.bulk.confirmPay', { count: snapshotCount })
                : t('bills.bulk.confirmApprove', { count: snapshotCount })}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={restoreBillId != null}
        title={t('bills.restore.confirmTitle')}
        description={t('bills.restore.confirmBody')}
        confirmLabel={t('bills.restore.confirmCta')}
        cancelLabel={t('bills.restore.cancelCta')}
        confirmVariant="primary"
        onConfirm={() => {
          if (restoreBillId) onAction(restoreBillId, 'restore')
          setRestoreBillId(null)
        }}
        onCancel={() => setRestoreBillId(null)}
      />
      <ConfirmDialog
        isOpen={archiveBillId != null}
        title={t('bills.archive.title')}
        description={t('bills.archive.description')}
        confirmLabel={t('bills.archive.confirm')}
        cancelLabel={t('bills.archive.cancel')}
        confirmVariant="danger"
        onConfirm={() => {
          if (archiveBillId) onAction(archiveBillId, 'archive')
          setArchiveBillId(null)
        }}
        onCancel={() => setArchiveBillId(null)}
      />
      <ConfirmDialog
        isOpen={deleteBillId != null}
        title={t('bills.delete.title')}
        description={t('bills.delete.description')}
        confirmLabel={t('bills.delete.confirm')}
        cancelLabel={t('bills.delete.cancel')}
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteBillId) onAction(deleteBillId, 'delete')
          setDeleteBillId(null)
        }}
        onCancel={() => setDeleteBillId(null)}
      />
    </div>
  )
}
