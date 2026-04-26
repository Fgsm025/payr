import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import { useAppStore } from '../../store/useAppStore'

type VendorRow = {
  id: string
  name: string
  email: string
  paymentTerms: number
  billsCount: number
  outstanding: number
}

export default function VendorsPage() {
  const bills = useAppStore((state) => state.bills)
  const vendors = useAppStore((state) => state.vendors)
  const addVendor = useAppStore((state) => state.addVendor)
  const updateVendor = useAppStore((state) => state.updateVendor)
  const deleteVendor = useAppStore((state) => state.deleteVendor)
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

  const onSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const terms = Number(paymentTerms)

    if (!trimmedName || !trimmedEmail || Number.isNaN(terms) || terms <= 0) {
      setError('Name, email and valid payment terms are required.')
      return
    }

    if (editingVendorId) {
      updateVendor(editingVendorId, { name: trimmedName, email: trimmedEmail, paymentTerms: terms })
    } else {
      addVendor({ name: trimmedName, email: trimmedEmail, paymentTerms: terms })
    }
    onCloseModal()
  }

  const onConfirmDelete = () => {
    if (!vendorToDelete) return
    deleteVendor(vendorToDelete.id)
    setVendorToDelete(null)
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
      <DataTable columns={columns} data={rows} rowKey={(row) => row.id} />
      <Modal
        title={editingVendorId ? 'Edit vendor' : 'New vendor'}
        isOpen={isModalOpen}
        onClose={onCloseModal}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Vendor name"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <input
            value={paymentTerms}
            onChange={(event) => setPaymentTerms(event.target.value)}
            placeholder="Payment terms (days)"
            type="number"
            min={1}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onCloseModal}>
              Cancel
            </Button>
            <Button type="submit">{editingVendorId ? 'Save changes' : 'Create vendor'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(vendorToDelete)}
        title="Delete vendor"
        description={
          vendorToDelete
            ? `Are you sure you want to delete ${vendorToDelete.name}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete vendor"
        onCancel={() => setVendorToDelete(null)}
        onConfirm={onConfirmDelete}
      />
    </div>
  )
}
