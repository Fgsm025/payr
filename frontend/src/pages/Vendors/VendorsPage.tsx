import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
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

  const rows: VendorRow[] = vendors.map((vendor) => {
    const vendorBills = bills.filter((bill) => bill.vendorId === vendor.id)
    const outstanding = vendorBills
      .filter((bill) => !['paid', 'archived', 'rejected'].includes(bill.status))
      .reduce((sum, bill) => sum + bill.amount, 0)

    return { ...vendor, billsCount: vendorBills.length, outstanding }
  })

  const columns = [
    { key: 'name', label: 'Vendor Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'paymentTerms', label: 'Payment Terms', render: (row: VendorRow) => `${row.paymentTerms} days` },
    { key: 'outstanding', label: 'Outstanding Balance', render: (row: VendorRow) => `$${row.outstanding.toLocaleString()}` },
    { key: 'billsCount', label: 'Bills Count', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">View</Button>
          <Button variant="secondary" size="sm">Edit</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button>New Vendor</Button>
      </div>
      <DataTable columns={columns} data={rows} rowKey={(row) => row.id} />
    </div>
  )
}
