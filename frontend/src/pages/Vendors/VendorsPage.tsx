import { useMemo, useState } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import TableSkeleton from '../../components/ui/TableSkeleton'
import { useTranslation } from '../../i18n/useI18n'
import { useWorkspaceBillsQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { useCreateVendorMutation, useDeleteVendorMutation, useUpdateVendorMutation } from '@/hooks/useVendorMutations'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'

type VendorRow = {
  id: string
  name: string
  email: string
  taxId?: string | null
  paymentTerms: number
  defaultCurrency?: string | null
  category?: string | null
  billsCount: number
  outstanding: number
}

const VENDOR_CURRENCIES = ['USD', 'ARS', 'EUR'] as const
const VENDOR_CATEGORIES = ['Software', 'Cloud Services', 'Office Supplies', 'Marketing', 'Professional Services'] as const

export default function VendorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const vendorsQuery = useWorkspaceVendorsQuery()
  const billsQuery = useWorkspaceBillsQuery()
  const createVendor = useCreateVendorMutation()
  const updateVendor = useUpdateVendorMutation()
  const deleteVendor = useDeleteVendorMutation()

  const vendors = vendorsQuery.data ?? []
  const bills = useMemo(
    () => (billsQuery.data ?? []).map((raw) => mapApiBillToStore(raw)),
    [billsQuery.data],
  )

  const tableLoading = vendorsQuery.isPending && !vendorsQuery.data

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [vendorToDelete, setVendorToDelete] = useState<VendorRow | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [taxId, setTaxId] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('30')
  const [defaultCurrency, setDefaultCurrency] = useState<(typeof VENDOR_CURRENCIES)[number]>('USD')
  const [category, setCategory] = useState<(typeof VENDOR_CATEGORIES)[number]>('Software')
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const rows: VendorRow[] = useMemo(
    () =>
      vendors.map((vendor) => {
        const vendorBills = bills.filter((bill) => bill.vendorId === vendor.id)
        const outstanding = vendorBills
          .filter((bill) => !['paid', 'archived', 'rejected'].includes(bill.status))
          .reduce((sum, bill) => sum + bill.amount, 0)

        return { ...vendor, billsCount: vendorBills.length, outstanding }
      }),
    [bills, vendors],
  )

  const resetModal = () => {
    setName('')
    setEmail('')
    setTaxId('')
    setPaymentTerms('30')
    setDefaultCurrency('USD')
    setCategory('Software')
    setEditingVendorId(null)
    setError('')
  }

  const openCreateModal = () => {
    resetModal()
    setIsModalOpen(true)
  }

  const openEditModal = (vendor: VendorRow) => {
    setEditingVendorId(vendor.id)
    setName(vendor.name)
    setEmail(vendor.email)
    setTaxId(vendor.taxId ?? '')
    setPaymentTerms(String(vendor.paymentTerms))
    setDefaultCurrency((vendor.defaultCurrency as (typeof VENDOR_CURRENCIES)[number]) ?? 'USD')
    setCategory((vendor.category as (typeof VENDOR_CATEGORIES)[number]) ?? 'Software')
    setError('')
    setIsModalOpen(true)
  }

  const onCloseModal = () => {
    setIsModalOpen(false)
    resetModal()
  }

  const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedTaxId = taxId.trim()
    const terms = Number(paymentTerms)

    if (!trimmedName || !trimmedEmail || !trimmedTaxId || Number.isNaN(terms) || terms <= 0) {
      setError(t('vendors.error.required'))
      return
    }

    setError('')
    try {
      if (editingVendorId) {
        await updateVendor.mutateAsync({
          id: editingVendorId,
          body: {
            name: trimmedName,
            email: trimmedEmail,
            taxId: trimmedTaxId,
            paymentTerms: terms,
            defaultCurrency,
            category,
          },
        })
      } else {
        await createVendor.mutateAsync({
          name: trimmedName,
          email: trimmedEmail,
          taxId: trimmedTaxId,
          paymentTerms: terms,
          defaultCurrency,
          category,
        })
      }
      onCloseModal()
    } catch {
      setError(t('vendors.error.saveFailed'))
    }
  }

  const onConfirmDelete = async () => {
    if (!vendorToDelete) return
    try {
      await deleteVendor.mutateAsync(vendorToDelete.id)
      setVendorToDelete(null)
      setDeleteError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.toLowerCase().includes('existing bills')) {
        setDeleteError(t('vendors.error.deleteBlockedByBills'))
      } else {
        setDeleteError(t('vendors.error.deleteFailed'))
      }
    }
  }

  const columns = useMemo(
    () => [
      { key: 'name', label: t('vendors.table.name'), sortable: true },
      { key: 'email', label: t('vendors.table.email'), sortable: true },
      { key: 'taxId', label: t('vendors.table.taxId') },
      {
        key: 'paymentTerms',
        label: t('vendors.table.paymentTerms'),
        render: (row: VendorRow) => t('vendors.table.termsDays', { count: row.paymentTerms }),
      },
      { key: 'defaultCurrency', label: t('vendors.table.defaultCurrency') },
      { key: 'category', label: t('vendors.table.category') },
      {
        key: 'outstanding',
        label: t('vendors.table.outstanding'),
        render: (row: VendorRow) => `$${row.outstanding.toLocaleString()}`,
      },
      { key: 'billsCount', label: t('vendors.table.billsCount'), sortable: true },
      {
        key: 'actions',
        label: t('vendors.table.actions'),
        render: (row: VendorRow) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/vendors/${row.id}`)}
              className="cursor-pointer rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-1.5 text-[var(--color-primary)] transition hover:brightness-95"
              aria-label={t('vendors.action.viewAria', { name: row.name })}
              title={t('vendors.action.viewTitle')}
            >
              <Eye size={15} />
            </button>
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className="cursor-pointer rounded-lg border border-[var(--color-border)] p-1.5 text-slate-500 transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
              aria-label={t('vendors.action.edit')}
              title={t('vendors.action.edit')}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError('')
                setVendorToDelete(row)
              }}
              className="vendor-delete-btn cursor-pointer rounded-lg border border-[var(--color-border)] p-1.5 text-slate-500 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--color-border)] disabled:hover:bg-transparent disabled:hover:text-slate-500"
              aria-label={t('vendors.action.deleteAria', { name: row.name })}
              title={row.billsCount > 0 ? t('vendors.action.deleteDisabledTitle') : t('vendors.action.deleteTitle')}
              disabled={row.billsCount > 0}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [t],
  )

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreateModal}>{t('vendors.newVendor')}</Button>
      </div>
      {tableLoading ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <TableSkeleton rows={8} cols={9} />
        </div>
      ) : (
        <DataTable columns={columns} data={rows} rowKey={(row) => row.id} />
      )}
      {deleteError ? <p className="mt-3 text-sm text-red-600">{deleteError}</p> : null}
      <Modal
        title={editingVendorId ? t('vendors.modal.editTitle') : t('vendors.modal.newTitle')}
        isOpen={isModalOpen}
        onClose={onCloseModal}
      >
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t('vendors.form.vendorName')}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('vendors.form.vendorNamePlaceholder')}
              autoComplete="organization"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t('vendors.form.email')}</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('vendors.form.emailPlaceholder')}
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t('vendors.form.taxId')}</span>
            <input
              value={taxId}
              onChange={(event) => setTaxId(event.target.value)}
              placeholder={t('vendors.form.taxIdPlaceholder')}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t('vendors.form.paymentTerms')}</span>
            <input
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.target.value)}
              placeholder={t('vendors.form.paymentTermsPlaceholder')}
              type="number"
              min={1}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t('vendors.form.defaultCurrency')}</span>
            <select
              value={defaultCurrency}
              onChange={(event) => setDefaultCurrency(event.target.value as (typeof VENDOR_CURRENCIES)[number])}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            >
              {VENDOR_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t('vendors.form.category')}</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as (typeof VENDOR_CATEGORIES)[number])}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            >
              {VENDOR_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onCloseModal}>
              {t('vendors.form.cancel')}
            </Button>
            <Button type="submit" disabled={createVendor.isPending || updateVendor.isPending}>
              {editingVendorId ? t('vendors.form.save') : t('vendors.form.create')}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(vendorToDelete)}
        title={t('vendors.delete.title')}
        description={
          vendorToDelete ? t('vendors.delete.description', { name: vendorToDelete.name }) : ''
        }
        confirmLabel={t('vendors.delete.confirm')}
        onCancel={() => setVendorToDelete(null)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  )
}
