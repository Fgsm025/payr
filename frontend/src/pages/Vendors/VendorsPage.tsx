import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import TableSkeleton from '../../components/ui/TableSkeleton'
import { useWorkspaceBillsQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { useCreateVendorMutation, useDeleteVendorMutation, useUpdateVendorMutation } from '@/hooks/useVendorMutations'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'

type VendorRow = {
  id: string
  name: string
  email: string
  paymentTerms: number
  billsCount: number
  outstanding: number
}

export default function VendorsPage() {
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
  const [paymentTerms, setPaymentTerms] = useState('30')
  const [error, setError] = useState('')

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
    setPaymentTerms('30')
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
    setPaymentTerms(String(vendor.paymentTerms))
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
    const terms = Number(paymentTerms)

    if (!trimmedName || !trimmedEmail || Number.isNaN(terms) || terms <= 0) {
      setError('Name, email and valid payment terms are required.')
      return
    }

    setError('')
    try {
      if (editingVendorId) {
        await updateVendor.mutateAsync({
          id: editingVendorId,
          body: { name: trimmedName, email: trimmedEmail, paymentTerms: terms },
        })
      } else {
        await createVendor.mutateAsync({ name: trimmedName, email: trimmedEmail, paymentTerms: terms })
      }
      onCloseModal()
    } catch {
      setError('Could not save vendor. Try again.')
    }
  }

  const onConfirmDelete = async () => {
    if (!vendorToDelete) return
    try {
      await deleteVendor.mutateAsync(vendorToDelete.id)
      setVendorToDelete(null)
    } catch {
      setVendorToDelete(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Vendor Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'paymentTerms', label: 'Payment Terms', render: (row: VendorRow) => `${row.paymentTerms} days` },
    { key: 'outstanding', label: 'Outstanding Balance', render: (row: VendorRow) => `$${row.outstanding.toLocaleString()}` },
    { key: 'billsCount', label: 'Bills Count', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: VendorRow) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <button
            type="button"
            onClick={() => setVendorToDelete(row)}
            className="vendor-delete-btn rounded-lg border border-[var(--color-border)] p-1.5 text-slate-500 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${row.name}`}
            title="Delete vendor"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreateModal}>New Vendor</Button>
      </div>
      {tableLoading ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : (
        <DataTable columns={columns} data={rows} rowKey={(row) => row.id} />
      )}
      <Modal
        title={editingVendorId ? 'Edit vendor' : 'New vendor'}
        isOpen={isModalOpen}
        onClose={onCloseModal}
      >
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Vendor name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Acme Supplies"
              autoComplete="organization"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="billing@vendor.com"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Payment terms (days)</span>
            <input
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.target.value)}
              placeholder="30"
              type="number"
              min={1}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVendor.isPending || updateVendor.isPending}>
              {editingVendorId ? 'Save changes' : 'Create vendor'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(vendorToDelete)}
        title="Delete vendor"
        description={
          vendorToDelete
            ? `Are you sure you want to delete ${vendorToDelete.name}? Vendors with bills cannot be deleted.`
            : ''
        }
        confirmLabel="Delete vendor"
        onCancel={() => setVendorToDelete(null)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  )
}
