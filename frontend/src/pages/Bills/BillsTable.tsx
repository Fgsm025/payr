import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import type { Bill, BillStatus } from '../../data/mockData'

type BillRow = Bill & { vendorName: string; displayStatus: BillStatus | 'overdue' }

type BillsTableProps = {
  bills: BillRow[]
  activeTab: string
  onAction: (billId: string, action: 'submit' | 'approve' | 'reject' | 'pay' | 'archive') => void
  onView: (billId: string) => void
}

export default function BillsTable({ bills, activeTab, onAction, onView }: BillsTableProps) {
  const renderActions = (row: BillRow) => {
    if (activeTab === 'drafts') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => onAction(row.id, 'submit')}>Submit</Button>
          <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>View</Button>
          <Button variant="secondary" size="sm" onClick={() => onAction(row.id, 'archive')}>Archive</Button>
        </div>
      )
    }
    if (activeTab === 'for_approval') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => onAction(row.id, 'approve')}>Approve</Button>
          <Button variant="danger" size="sm" onClick={() => onAction(row.id, 'reject')}>Reject</Button>
          <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>View</Button>
        </div>
      )
    }
    if (activeTab === 'for_payment') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm" onClick={() => onAction(row.id, 'pay')}>Mark as Paid</Button>
          <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>View</Button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onView(row.id)}>View</Button>
      </div>
    )
  }

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { key: 'vendorName', label: 'Vendor', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (row: BillRow) => `$${row.amount.toLocaleString()}` },
    { key: 'invoiceDate', label: 'Invoice Date', sortable: true },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { key: 'status', label: 'Status', render: (row: BillRow) => <StatusBadge status={row.displayStatus} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: BillRow) => renderActions(row),
    },
  ]

  return <DataTable columns={columns} data={bills} rowKey={(row) => row.id} />
}
