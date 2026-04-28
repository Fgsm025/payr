import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { useTranslation } from '@/i18n/useI18n'
import { useWorkspaceBillsQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'

export default function VendorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const vendorsQuery = useWorkspaceVendorsQuery()
  const billsQuery = useWorkspaceBillsQuery()

  const vendor = useMemo(() => (vendorsQuery.data ?? []).find((item) => item.id === id), [vendorsQuery.data, id])
  const vendorBills = useMemo(
    () => (billsQuery.data ?? []).map((raw) => mapApiBillToStore(raw)).filter((bill) => bill.vendorId === id),
    [billsQuery.data, id],
  )

  if (!id) return <Navigate to="/vendors" replace />
  if (vendorsQuery.isError || billsQuery.isError) return <Navigate to="/vendors" replace />
  if (!vendor && !vendorsQuery.isPending) return <Navigate to="/vendors" replace />
  if (!vendor) return null

  const outstanding = vendorBills
    .filter((bill) => !['paid', 'archived', 'rejected'].includes(bill.status))
    .reduce((sum, bill) => sum + bill.amount, 0)
  const paidTotal = vendorBills
    .filter((bill) => bill.status === 'paid')
    .reduce((sum, bill) => sum + bill.amount, 0)
  const lastInvoiceDate = [...vendorBills]
    .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())[0]
    ?.invoiceDate

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5 md:p-6">
        <div className="flex flex-col items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{vendor.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{vendor.email}</p>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => navigate('/vendors')}>
            {t('vendors.details.back')}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <InfoCard label={t('vendors.details.paymentTerms')} value={t('vendors.table.termsDays', { count: vendor.paymentTerms })} />
          <InfoCard label={t('vendors.details.taxId')} value={vendor.taxId?.trim() ? vendor.taxId : '—'} />
          <InfoCard label={t('vendors.details.defaultCurrency')} value={vendor.defaultCurrency?.trim() ? vendor.defaultCurrency : 'USD'} />
          <InfoCard label={t('vendors.details.category')} value={vendor.category?.trim() ? vendor.category : 'Software'} />
          <InfoCard label={t('vendors.details.totalBills')} value={String(vendorBills.length)} />
          <InfoCard label={t('vendors.details.outstanding')} value={`$${outstanding.toLocaleString()}`} />
          <InfoCard label={t('vendors.details.totalPaid')} value={`$${paidTotal.toLocaleString()}`} />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          {t('vendors.details.lastInvoice')}: {lastInvoiceDate ?? '—'}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5 md:p-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">{t('vendors.details.relatedBills')}</h3>
        {vendorBills.length === 0 ? (
          <p className="text-sm text-slate-500">{t('vendors.details.noBills')}</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-3 md:hidden">
              {vendorBills.map((bill) => (
                <div key={bill.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="cursor-pointer text-left font-medium text-[var(--color-primary)] hover:underline"
                      onClick={() => navigate(`/bills/${bill.id}`)}
                    >
                      {bill.invoiceNumber}
                    </button>
                    <StatusBadge status={bill.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <p>
                      {t('bills.table.invoiceDate')}: {bill.invoiceDate}
                    </p>
                    <p>
                      {t('bills.table.dueDate')}: {bill.dueDate}
                    </p>
                    <p className="col-span-2 font-semibold text-slate-900">${bill.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-xl border border-[var(--color-border)] md:block">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-[var(--color-surface)] text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-2">{t('bills.table.invoiceNumber')}</th>
                    <th className="px-4 py-2">{t('bills.table.invoiceDate')}</th>
                    <th className="px-4 py-2">{t('bills.table.dueDate')}</th>
                    <th className="px-4 py-2 text-right">{t('bills.table.amount')}</th>
                    <th className="px-4 py-2">{t('bills.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorBills.map((bill) => (
                    <tr key={bill.id} className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          className="cursor-pointer font-medium text-[var(--color-primary)] hover:underline"
                          onClick={() => navigate(`/bills/${bill.id}`)}
                        >
                          {bill.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{bill.invoiceDate}</td>
                      <td className="px-4 py-2.5 text-slate-700">{bill.dueDate}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-900">${bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={bill.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}
