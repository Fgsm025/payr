import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Bill } from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import Button from '../../components/ui/Button'
import BillFilters from './BillFilters'
import BillsTable from './BillsTable'
import CreateBillModal from './CreateBillModal'
import TableSkeleton from '../../components/ui/TableSkeleton'
import { useTranslation } from '../../i18n/useI18n'
import { useWorkspaceBillsQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'
import { API_BASE_URL } from '@/lib/apiBaseUrl'
import { queryClient } from '@/lib/queryClient'
import { BILLS_TAB_VALUES } from '@/lib/billsTab'

const TAB_VALUES = BILLS_TAB_VALUES

const tabStatuses: Record<string, Bill['status'][]> = {
  drafts: ['draft', 'rejected'],
  for_approval: ['pending_approval'],
  for_payment: ['approved', 'scheduled'],
  history: ['paid'],
  archived: ['archived'],
}

export default function BillsPage() {
  const { t } = useTranslation()
  const billsQuery = useWorkspaceBillsQuery()
  const vendorsQuery = useWorkspaceVendorsQuery()
  const bills = useMemo(() => (billsQuery.data ?? []).map((raw) => mapApiBillToStore(raw)), [billsQuery.data])
  const vendors = vendorsQuery.data ?? []
  const tableLoading = billsQuery.isPending && !billsQuery.data
  const authToken = useAppStore((state) => state.authToken)
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId)
  const logout = useAppStore((state) => state.logout)
  const showSnack = useAppStore((state) => state.showSnack)
  const transitionBill = useAppStore((state) => state.transitionBill)
  const isCreateBillModalOpen = useAppStore((state) => state.isCreateBillModalOpen)
  const openCreateBillModal = useAppStore((state) => state.openCreateBillModal)
  const closeCreateBillModal = useAppStore((state) => state.closeCreateBillModal)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const isValidInitialTab = initialTab && TAB_VALUES.includes(initialTab as (typeof TAB_VALUES)[number])
  const [activeTab, setActiveTab] = useState(isValidInitialTab ? initialTab : 'drafts')
  const [filters, setFilters] = useState({ search: '', vendorFilter: 'all', dateFrom: '', dateTo: '' })
  useEffect(() => {
    if (searchParams.get('toast') !== 'approved') return
    showSnack(t('bills.approve.successToast'), 'success')
    const next = new URLSearchParams(searchParams)
    next.delete('toast')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, showSnack, t])

  const tabConfig = useMemo(
    () => [
      { label: t('bills.tab.drafts'), value: 'drafts' },
      { label: t('bills.tab.forApproval'), value: 'for_approval' },
      { label: t('bills.tab.forPayment'), value: 'for_payment' },
      { label: t('bills.tab.history'), value: 'history' },
      { label: t('bills.tab.archived'), value: 'archived' },
    ],
    [t],
  )

  const vendorById = useMemo(
    () => Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor])),
    [vendors],
  )

  const unknownVendor = t('dashboard.unknownVendor')
  const filtered = useMemo(
    () =>
      bills
        .filter((bill) => tabStatuses[activeTab].includes(bill.status))
        .map((bill) => {
          const overdue = new Date(bill.dueDate) < new Date() && bill.status !== 'paid'
          const displayStatus: Bill['status'] | 'overdue' = overdue ? 'overdue' : bill.status
          return {
            ...bill,
            vendorName: vendorById[bill.vendorId]?.name || unknownVendor,
            displayStatus,
            rejectionReason:
              bill.status === 'rejected'
                ? [...(bill.history ?? [])]
                    .reverse()
                    .find((h) => h.status === 'rejected')
                    ?.comment
                : undefined,
          }
        })
        .filter((bill) => {
          const query = filters.search.toLowerCase()
          const queryMatch =
            bill.vendorName.toLowerCase().includes(query) || bill.invoiceNumber.toLowerCase().includes(query)
          const vendorMatch = filters.vendorFilter === 'all' || bill.vendorId === filters.vendorFilter
          const due = new Date(bill.dueDate)
          const fromMatch = !filters.dateFrom || due >= new Date(filters.dateFrom)
          const toMatch = !filters.dateTo || due <= new Date(filters.dateTo)
          return queryMatch && vendorMatch && fromMatch && toMatch
        })
        .sort((a, b) => {
          const aLastEntry = a.history && a.history.length > 0 ? a.history[a.history.length - 1] : undefined
          const bLastEntry = b.history && b.history.length > 0 ? b.history[b.history.length - 1] : undefined
          const aLast = aLastEntry?.date ?? a.dueDate
          const bLast = bLastEntry?.date ?? b.dueDate
          return new Date(bLast).getTime() - new Date(aLast).getTime()
        }),
    [activeTab, bills, filters, vendorById, unknownVendor],
  )

  const onFilterChange = (key: 'search' | 'vendorFilter' | 'dateFrom' | 'dateTo', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const runBulkStatusAction = async (billIds: string[], action: 'approve' | 'pay') => {
    if (!authToken || billIds.length === 0) return
    const requests = billIds.map((billId) =>
      fetch(`${API_BASE_URL}/bills/${billId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Entity-Id': activeWorkspaceId,
        },
        body: JSON.stringify({ action }),
      }),
    )

    const results = await Promise.all(requests)
    if (results.some((res) => res.status === 401)) {
      logout()
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId] })
    if (results.every((res) => res.ok)) {
      showSnack(action === 'approve' ? 'Selected bills approved.' : 'Selected bills paid.', 'success')
      return
    }
    showSnack('Some selected bills could not be processed.', 'error')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex flex-wrap gap-2">
          {tabConfig.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value)
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.set('tab', tab.value)
                  return next
                })
              }}
              variant={activeTab === tab.value ? 'primary' : 'secondary'}
              className={activeTab === tab.value ? 'font-medium' : 'font-medium text-slate-600'}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Button onClick={openCreateBillModal}>{t('bills.newBill')}</Button>
      </div>
      <BillFilters {...filters} vendors={vendors} onChange={onFilterChange} />
      {tableLoading ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <div
          className={
            billsQuery.isFetching && billsQuery.data ? 'opacity-60 transition-opacity duration-200' : ''
          }
        >
          <BillsTable
            bills={filtered}
            activeTab={activeTab}
            onAction={(billId, action) => void transitionBill(billId, action)}
            onView={(billId) => navigate(`/bills/${billId}`, { state: { billsTab: activeTab } })}
            onBulkAction={runBulkStatusAction}
          />
        </div>
      )}
      <CreateBillModal
        isOpen={isCreateBillModalOpen}
        onClose={closeCreateBillModal}
        onCreated={() => setActiveTab('drafts')}
      />
    </div>
  )
}
