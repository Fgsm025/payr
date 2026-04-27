import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Bill } from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import BillFilters from './BillFilters'
import BillsTable from './BillsTable'
import CreateBillModal from './CreateBillModal'
import ConfirmPaymentModal from './ConfirmPaymentModal'
import TableSkeleton from '../../components/ui/TableSkeleton'
import { useTranslation } from '../../i18n/useI18n'
import { useWorkspaceBillsQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'
import { API_BASE_URL } from '@/lib/apiBaseUrl'
import { queryClient } from '@/lib/queryClient'

const TAB_VALUES = ['drafts', 'for_approval', 'for_payment', 'history', 'archived'] as const

const tabStatuses: Record<string, Bill['status'][]> = {
  drafts: ['draft', 'rejected'],
  for_approval: ['pending_approval'],
  for_payment: ['approved'],
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
  const paymentMethods = useAppStore((state) => state.paymentMethods)
  const transitionBill = useAppStore((state) => state.transitionBill)
  const authToken = useAppStore((state) => state.authToken)
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId)
  const logout = useAppStore((state) => state.logout)
  const showSnack = useAppStore((state) => state.showSnack)
  const isCreateBillModalOpen = useAppStore((state) => state.isCreateBillModalOpen)
  const openCreateBillModal = useAppStore((state) => state.openCreateBillModal)
  const closeCreateBillModal = useAppStore((state) => state.closeCreateBillModal)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const isValidInitialTab = initialTab && TAB_VALUES.includes(initialTab as (typeof TAB_VALUES)[number])
  const [activeTab, setActiveTab] = useState(isValidInitialTab ? initialTab : 'drafts')
  const [filters, setFilters] = useState({ search: '', vendorFilter: 'all', dateFrom: '', dateTo: '' })
  const [payingBill, setPayingBill] = useState<{ id: string; amount: number; dueDate: string } | null>(null)
  const [rejectingBillId, setRejectingBillId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null)
  const [archivingBillId, setArchivingBillId] = useState<string | null>(null)
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
          return {
            ...bill,
            vendorName: vendorById[bill.vendorId]?.name || unknownVendor,
            displayStatus: overdue ? 'overdue' : bill.status,
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
          const aLast = a.history?.at(-1)?.date ?? a.dueDate
          const bLast = b.history?.at(-1)?.date ?? b.dueDate
          return new Date(bLast).getTime() - new Date(aLast).getTime()
        }),
    [activeTab, bills, filters, vendorById, unknownVendor],
  )

  const onFilterChange = (key: 'search' | 'vendorFilter' | 'dateFrom' | 'dateTo', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const onConfirmPayment = async ({
    paymentMethodId,
    scheduledDate,
  }: {
    paymentMethodId: string
    scheduledDate: string
  }) => {
    if (!payingBill) return
    await new Promise((resolve) => globalThis.setTimeout(resolve, 1000))
    await transitionBill(
      payingBill.id,
      'pay',
      t('bills.payComment', { date: scheduledDate, method: paymentMethodId }),
    )
  }

  const onConfirmReject = async () => {
    if (!rejectingBillId) return
    await transitionBill(rejectingBillId, 'reject', rejectComment.trim())
    setRejectingBillId(null)
    setRejectComment('')
  }

  const onDeleteDraft = async (billId: string) => {
    if (!authToken) return
    const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Entity-Id': activeWorkspaceId,
      },
    })
    if (response.status === 401) {
      logout()
      return
    }
    if (response.ok) {
      await queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId] })
      showSnack('Draft deleted.', 'success')
      return
    }
    showSnack('Could not delete draft bill.', 'error')
  }

  const onConfirmDeleteDraft = async () => {
    if (!deletingBillId) return
    await onDeleteDraft(deletingBillId)
    setDeletingBillId(null)
  }

  const onConfirmArchiveDraft = async () => {
    if (!archivingBillId) return
    await transitionBill(archivingBillId, 'archive')
    setArchivingBillId(null)
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
            onRejectRequest={(billId) => {
              setRejectingBillId(billId)
              setRejectComment('')
            }}
            onDeleteDraft={(billId) => setDeletingBillId(billId)}
            onArchiveRequest={(billId) => setArchivingBillId(billId)}
            onEdit={(billId) => navigate(`/bills/${billId}/edit`)}
            onView={(billId) => navigate(`/bills/${billId}`)}
            onPayRequest={(bill) => setPayingBill({ id: bill.id, amount: bill.amount, dueDate: bill.dueDate })}
          />
        </div>
      )}
      <CreateBillModal
        isOpen={isCreateBillModalOpen}
        onClose={closeCreateBillModal}
        onCreated={() => setActiveTab('drafts')}
      />
      <ConfirmPaymentModal
        isOpen={Boolean(payingBill)}
        amount={payingBill?.amount ?? 0}
        dueDate={payingBill?.dueDate ?? new Date().toISOString().slice(0, 10)}
        paymentMethods={paymentMethods}
        onClose={() => setPayingBill(null)}
        onConfirm={onConfirmPayment}
      />
      <Modal
        title={t('bills.reject.title')}
        isOpen={Boolean(rejectingBillId)}
        onClose={() => {
          setRejectingBillId(null)
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
                setRejectingBillId(null)
                setRejectComment('')
              }}
            >
              {t('bills.reject.cancel')}
            </Button>
            <Button type="button" variant="danger" onClick={() => void onConfirmReject()}>
              {t('bills.reject.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(deletingBillId)}
        title={t('bills.delete.title')}
        description={t('bills.delete.description')}
        confirmLabel={t('bills.delete.confirm')}
        cancelLabel={t('bills.delete.cancel')}
        onConfirm={() => void onConfirmDeleteDraft()}
        onCancel={() => setDeletingBillId(null)}
      />
      <ConfirmDialog
        isOpen={Boolean(archivingBillId)}
        title={t('bills.archive.title')}
        description={t('bills.archive.description')}
        confirmLabel={t('bills.archive.confirm')}
        cancelLabel={t('bills.archive.cancel')}
        confirmVariant="primary"
        confirmFirst
        onConfirm={() => void onConfirmArchiveDraft()}
        onCancel={() => setArchivingBillId(null)}
      />
    </div>
  )
}
