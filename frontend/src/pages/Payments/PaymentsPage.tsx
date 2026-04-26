import { useMemo, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import TableSkeleton from '../../components/ui/TableSkeleton'
import { usePaymentsQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { formatApiPaymentMethod } from '@/lib/paymentMethodLabel'

type PaymentRow = {
  id: string
  paymentDate: string
  vendor: string
  amount: number
  paymentMethod: string
  reference: string
}

export default function PaymentsPage() {
  const paymentsQuery = usePaymentsQuery()
  const vendorsQuery = useWorkspaceVendorsQuery()
  const vendors = vendorsQuery.data ?? []

  const rows = useMemo<PaymentRow[]>(() => {
    const data = paymentsQuery.data ?? []
    return data.map((p) => ({
      id: p.id,
      paymentDate: p.paymentDate.slice(0, 10),
      vendor: p.bill.vendor.name,
      amount: p.amount,
      paymentMethod: formatApiPaymentMethod(p.method),
      reference: p.reference ?? p.bill.invoiceNumber,
    }))
  }, [paymentsQuery.data])

  const tableLoading = paymentsQuery.isPending && !paymentsQuery.data

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
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.2fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_auto]">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Vendor</span>
            <select
              value={vendorFilter}
              onChange={(event) => setVendorFilter(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
            >
              <option value="">All vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.name}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
            />
          </label>
          <Button variant="secondary" onClick={onExport} disabled={!filteredRows.length} className="self-end">
            Export CSV
          </Button>
        </div>
      </div>
      {tableLoading ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <TableSkeleton rows={8} cols={5} />
        </div>
      ) : (
        <div
          className={
            paymentsQuery.isFetching && paymentsQuery.data ? 'opacity-60 transition-opacity duration-200' : ''
          }
        >
          <DataTable columns={columns} data={filteredRows} rowKey={(row) => row.id} />
        </div>
      )}
    </div>
  )
}
