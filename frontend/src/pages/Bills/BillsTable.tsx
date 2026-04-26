import { useMemo } from 'react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import type { Bill, BillStatus } from '../../data/mockData'
import { useTranslation } from '../../i18n/useI18n'

type BillRow = Bill & { vendorName: string; displayStatus: BillStatus | 'overdue' }

type BillsTableProps = {
  bills: BillRow[]
  activeTab: string
  onAction: (billId: string, action: 'submit' | 'approve' | 'reject' | 'pay' | 'archive') => void
  onView: (billId: string) => void
  onPayRequest: (bill: BillRow) => void
}

export default function BillsTable({ bills, activeTab, onAction, onView, onPayRequest }: Readonly<BillsTableProps>) {
  const { t } = useTranslation()

  const renderActions = (row: BillRow) => {
    if (activeTab === 'drafts') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => onAction(row.id, 'submit')}>
            {t('bills.action.submit')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.view')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onAction(row.id, 'archive')}>
            {t('bills.action.archive')}
          </Button>
        </div>
      )
    }
    if (activeTab === 'for_approval') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => onAction(row.id, 'approve')}>
            {t('bills.action.approve')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => onAction(row.id, 'reject')}>
            {t('bills.action.reject')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.view')}
          </Button>
        </div>
      )
    }
    if (activeTab === 'for_payment') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => onPayRequest(row)}>
            {t('bills.action.pay')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>
            {t('bills.action.view')}
          </Button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>
          {t('bills.action.view')}
        </Button>
      </div>
    )
  }

  const columns = useMemo(
    () => [
      { key: 'invoiceNumber', label: t('bills.table.invoiceNumber'), sortable: true },
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
        render: (row: BillRow) => <StatusBadge status={row.displayStatus} />,
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
