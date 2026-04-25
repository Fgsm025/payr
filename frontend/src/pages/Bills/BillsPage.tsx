import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Bill } from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import Button from '../../components/ui/Button'
import BillFilters from './BillFilters'
import BillsTable from './BillsTable'
import CreateBillModal from './CreateBillModal'

const tabConfig = [
  { label: 'Drafts', value: 'drafts' },
  { label: 'For Approval', value: 'for_approval' },
  { label: 'For Payment', value: 'for_payment' },
  { label: 'History', value: 'history' },
]

const tabStatuses: Record<string, Bill['status'][]> = {
  drafts: ['draft'],
  for_approval: ['pending_approval'],
  for_payment: ['approved', 'scheduled'],
  history: ['paid', 'rejected', 'archived'],
}

export default function BillsPage() {
  const bills = useAppStore((state) => state.bills)
  const vendors = useAppStore((state) => state.vendors)
  const transitionBill = useAppStore((state) => state.transitionBill)
  const isCreateBillModalOpen = useAppStore((state) => state.isCreateBillModalOpen)
  const openCreateBillModal = useAppStore((state) => state.openCreateBillModal)
  const closeCreateBillModal = useAppStore((state) => state.closeCreateBillModal)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('drafts')
  const [filters, setFilters] = useState({ search: '', vendorFilter: 'all', dateFrom: '', dateTo: '' })

  const vendorById = useMemo(
    () => Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor])),
    [vendors],
  )

  const filtered = useMemo(
    () =>
      bills
        .filter((bill) => tabStatuses[activeTab].includes(bill.status))
        .map((bill) => {
          const overdue = new Date(bill.dueDate) < new Date() && bill.status !== 'paid'
          return { ...bill, vendorName: vendorById[bill.vendorId]?.name || 'Unknown', displayStatus: overdue ? 'overdue' : bill.status }
        })
        .filter((bill) => {
          const query = filters.search.toLowerCase()
          const queryMatch = bill.vendorName.toLowerCase().includes(query) || bill.invoiceNumber.toLowerCase().includes(query)
          const vendorMatch = filters.vendorFilter === 'all' || bill.vendorId === filters.vendorFilter
          const due = new Date(bill.dueDate)
          const fromMatch = !filters.dateFrom || due >= new Date(filters.dateFrom)
          const toMatch = !filters.dateTo || due <= new Date(filters.dateTo)
          return queryMatch && vendorMatch && fromMatch && toMatch
        }),
    [activeTab, bills, filters, vendorById],
  )

  const onFilterChange = (key: 'search' | 'vendorFilter' | 'dateFrom' | 'dateTo', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex flex-wrap gap-2">
          {tabConfig.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              variant={activeTab === tab.value ? 'primary' : 'secondary'}
              className={activeTab === tab.value ? 'font-medium' : 'font-medium text-slate-600'}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Button onClick={openCreateBillModal}>New Bill</Button>
      </div>
      <BillFilters {...filters} vendors={vendors} onChange={onFilterChange} />
      <BillsTable
        bills={filtered}
        activeTab={activeTab}
        onAction={(billId, action) => transitionBill(billId, action)}
        onView={(billId) => navigate(`/bills/${billId}`)}
      />
      <CreateBillModal
        isOpen={isCreateBillModalOpen}
        onClose={closeCreateBillModal}
        onCreated={() => setActiveTab('drafts')}
      />
    </div>
  )
}
