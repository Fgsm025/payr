import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import type { Bill } from '../../data/mockData'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type PaymentRow = {
  id: string
  paymentDate: string
  vendor: string
  amount: number
  paymentMethod: string
  reference: string
}

type ApiPayment = {
  id: string
  amount: number
  paymentDate: string
  method: string
  reference: string | null
  bill: { invoiceNumber: string; vendor: { name: string } }
}

function extractPaymentMethodId(comment?: string) {
  if (!comment) return null
  const regex = /via\s+([a-z0-9-]+)/i
  const match = regex.exec(comment)
  return match?.[1] ?? null
}

function formatApiPaymentMethod(method: string): string {
  switch (method) {
    case 'ach':
      return 'ACH'
    case 'wire':
      return 'Wire Transfer'
    case 'check':
      return 'Check'
    default:
      return 'Bank Transfer'
  }
}

export default function PaymentsPage() {
  const bills = useAppStore((state) => state.bills)
  const vendors = useAppStore((state) => state.vendors)
  const paymentMethods = useAppStore((state) => state.paymentMethods)
  const authToken = useAppStore((state) => state.authToken)

  const [apiRows, setApiRows] = useState<PaymentRow[] | null>(null)
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  useEffect(() => {
    if (!authToken) {
      setApiRows(null)
      setPaymentsLoading(false)
      return
    }
    let cancelled = false
    setPaymentsLoading(true)
    void fetch(`${apiBaseUrl}/payments`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (res) => {
        if (!res.ok || cancelled) return
        const data = (await res.json()) as ApiPayment[]
        const mapped: PaymentRow[] = data.map((p) => ({
          id: p.id,
          paymentDate: p.paymentDate.slice(0, 10),
          vendor: p.bill.vendor.name,
          amount: p.amount,
          paymentMethod: formatApiPaymentMethod(p.method),
          reference: p.reference ?? p.bill.invoiceNumber,
        }))
        if (!cancelled) setApiRows(mapped)
      })
      .catch(() => {
        if (!cancelled) setApiRows(null)
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authToken])

  const storeRows = useMemo<PaymentRow[]>(() => {
    const vendorById = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor]))
    const paymentMethodById = Object.fromEntries(paymentMethods.map((method) => [method.id, method]))

    return bills
      .filter((bill: Bill) => bill.status === 'paid')
      .map((bill: Bill) => {
        const paidHistory = [...(bill.history ?? [])].reverse().find((entry) => entry.status === 'paid')
        const paymentMethodId = extractPaymentMethodId(paidHistory?.comment)
        const paymentMethod = paymentMethodId ? paymentMethodById[paymentMethodId] : null
        const paymentMethodLabel = paymentMethod
          ? `${paymentMethod.brand.toUpperCase()} **** ${paymentMethod.last4}`
          : 'Bank Transfer'

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

  const rows = apiRows ?? storeRows

  const [vendorFilter, setVendorFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const byVendor = !vendorFilter || row.vendor === vendorFilter
        const byFrom = !fromDate || row.paymentDate >= fromDate
        const byTo = !toDate || row.paymentDate <= toDate
        return byVendor && byFrom && byTo
      }),
    [fromDate, rows, toDate, vendorFilter],
  )

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
    const lines = filteredRows.map((row) => [
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
    <div className={`space-y-4 ${paymentsLoading ? 'opacity-50' : ''}`}>
      <div className='rounded-2xl border border-[var(--color-border)] bg-white p-5'>
        <div className='grid gap-3 lg:grid-cols-[minmax(220px,1.2fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_auto]'>
          <label className='text-sm'>
            <span className='mb-1 block text-slate-600'>Vendor</span>
            <select
              value={vendorFilter}
              onChange={(event) => setVendorFilter(event.target.value)}
              className='w-full rounded-xl border border-[var(--color-border)] px-3 py-2'
            >
              <option value=''>All vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.name}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
          <label className='text-sm'>
            <span className='mb-1 block text-slate-600'>From</span>
            <input
              type='date'
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className='w-full rounded-xl border border-[var(--color-border)] px-3 py-2'
            />
          </label>
          <label className='text-sm'>
            <span className='mb-1 block text-slate-600'>To</span>
            <input
              type='date'
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className='w-full rounded-xl border border-[var(--color-border)] px-3 py-2'
            />
          </label>
          <Button variant='secondary' onClick={onExport} disabled={!filteredRows.length} className='self-end'>
            Export CSV
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredRows} rowKey={(row) => row.id} />
    </div>
  )
}
