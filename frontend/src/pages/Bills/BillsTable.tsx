import { useMemo } from 'react'
import { Archive, Trash2 } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import type { Bill, BillStatus } from '../../data/mockData'
import { useTranslation } from '../../i18n/useI18n'

type BillRow = Bill & { vendorName: string; displayStatus: BillStatus | 'overdue'; rejectionReason?: string }

type BillsTableProps = {
  bills: BillRow[]
  activeTab: string
  onAction: (billId: string, action: 'submit' | 'approve' | 'reject' | 'pay' | 'archive' | 'restore') => void
  onRejectRequest: (billId: string) => void
  onDeleteDraft: (billId: string) => void
  onArchiveRequest: (billId: string) => void
  onEdit: (billId: string) => void
  onView: (billId: string) => void
  onPayRequest: (bill: BillRow) => void
}

export default function BillsTable({
  bills,
  activeTab,
  onAction,
  onRejectRequest,
  onDeleteDraft,
  onArchiveRequest,
  onEdit,
  onView,
  onPayRequest,
}: Readonly<BillsTableProps>) {
  const { t } = useTranslation()

  const renderActions = (row: BillRow) => {
    if (activeTab === 'drafts') {
      const isRejected = row.status === 'rejected'
      return (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.view')}
          </Button>
          {isRejected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onArchiveRequest(row.id)}
              title={t('bills.action.archive')}
              aria-label={t('bills.action.archive')}
              className="border-slate-200 text-slate-500 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
            >
              <Archive size={14} />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDeleteDraft(row.id)}
              className="vendor-delete-btn border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </Button>
          )}
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
          <Button variant="success" size="sm" onClick={() => onAction(row.id, 'restore')}>
            {t('bills.action.restore')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.view')}
          </Button>
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

  const columns = useMemo(
    () => [
      {
        key: 'invoiceNumber',
        label: t('bills.table.invoiceNumber'),
        sortable: true,
        render: (row: BillRow) => (
          <div>
            <p>{row.invoiceNumber}</p>
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
    ],
    [t, activeTab],
  )

  return <DataTable columns={columns} data={bills} rowKey={(row) => row.id} />
}
