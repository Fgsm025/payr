import { useMemo, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import TableSkeleton from '../../components/ui/TableSkeleton'
import { useTranslation } from '../../i18n/useI18n'
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
  const { t } = useTranslation()
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

  const columns = useMemo(
    () => [
      { key: 'paymentDate', label: t('payments.table.paymentDate'), sortable: true },
      { key: 'vendor', label: t('payments.table.vendor'), sortable: true },
      {
        key: 'amount',
        label: t('payments.table.amount'),
        sortable: true,
        render: (row: PaymentRow) => `$${row.amount.toLocaleString()}`,
      },
      { key: 'paymentMethod', label: t('payments.table.paymentMethod') },
      { key: 'reference', label: t('payments.table.reference') },
    ],
    [t],
  )

  const onExport = () => {
    const header = [
      t('payments.csv.paymentDate'),
      t('payments.csv.vendor'),
      t('payments.csv.amount'),
      t('payments.csv.paymentMethod'),
      t('payments.csv.reference'),
    ]
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
    const dateStr = new Date().toISOString().slice(0, 10)
    link.download = t('payments.export.filename', { date: dateStr })
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.2fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_auto]">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">{t('payments.filters.vendor')}</span>
            <select
              value={vendorFilter}
              onChange={(event) => setVendorFilter(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
            >
              <option value="">{t('payments.filters.allVendors')}</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.name}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">{t('payments.filters.from')}</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">{t('payments.filters.to')}</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
            />
          </label>
          <Button variant="secondary" onClick={onExport} disabled={!filteredRows.length} className="self-end">
            {t('payments.exportCsv')}
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
