import { useMemo } from 'react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

type PaymentRow = {
  id: string
  paymentDate: string
  vendor: string
  amount: number
  paymentMethod: string
  reference: string
}

function extractPaymentMethodId(comment?: string) {
  if (!comment) return null
  const regex = /via\s+([a-z0-9-]+)/i
  const match = regex.exec(comment)
  return match?.[1] ?? null
}

export default function PaymentsPage() {
  const bills = useAppStore((state) => state.bills)
  const vendors = useAppStore((state) => state.vendors)
  const paymentMethods = useAppStore((state) => state.paymentMethods)

  const rows = useMemo<PaymentRow[]>(() => {
    const vendorById = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor]))
    const paymentMethodById = Object.fromEntries(paymentMethods.map((method) => [method.id, method]))

    return bills
      .filter((bill) => bill.status === 'paid')
      .map((bill) => {
        const paidHistory = [...(bill.history ?? [])].reverse().find((entry) => entry.status === 'paid')
        const paymentMethodId = extractPaymentMethodId(paidHistory?.comment)
        const paymentMethod = paymentMethodId ? paymentMethodById[paymentMethodId] : null
        const paymentMethodLabel = paymentMethod
          ? `${paymentMethod.brand.toUpperCase()} **** ${paymentMethod.last4}`
          : 'Manual / Unknown'

        return {
          id: bill.id,
          paymentDate: bill.paidDate ?? paidHistory?.date ?? bill.dueDate,
          vendor: vendorById[bill.vendorId]?.name ?? 'Unknown',
          amount: bill.amount,
          paymentMethod: paymentMethodLabel,
          reference: `PMT-${bill.id.toUpperCase()}`,
        }
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [bills, paymentMethods, vendors])

  const columns = [
    { key: 'paymentDate', label: 'Payment Date', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (row: PaymentRow) => `$${row.amount.toLocaleString()}`,
    },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'reference', label: 'Reference #' },
  ]

  const onExport = () => {
    const header = ['Payment Date', 'Vendor', 'Amount', 'Payment Method', 'Reference #']
    const lines = rows.map((row) => [
      row.paymentDate,
      row.vendor,
      row.amount.toFixed(2),
      row.paymentMethod,
      row.reference,
    ])
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`
    const csvContent = [header, ...lines]
      .map((line) => line.map((value) => escapeCsv(String(value))).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payments-history-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-2xl border border-[var(--color-border)] bg-white p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h3 className='text-lg font-semibold text-slate-900'>Payment History</h3>
            <p className='mt-1 text-sm text-slate-500'>Completed bill payments.</p>
          </div>
          <Button variant='secondary' onClick={onExport} disabled={!rows.length}>
            Export CSV
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={rows} rowKey={(row) => row.id} />
    </div>
  )
}
