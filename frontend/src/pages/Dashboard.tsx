import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import type { Bill } from '../data/mockData'
import TableSkeleton from '../components/ui/TableSkeleton'
import type { Locale } from '../i18n/translations'
import type { TranslateFn } from '../i18n/useI18n'
import { useTranslation } from '../i18n/useI18n'
import {
  useDashboardApAgingQuery,
  useDashboardSummaryQuery,
  useWorkspaceBillsQuery,
  useWorkspaceVendorsQuery,
} from '@/hooks/useWorkspaceQueries'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Whole calendar days from today to due date (negative = overdue). */
function calendarDaysFromToday(dueDateStr: string) {
  const due = startOfDay(new Date(dueDateStr))
  const today = startOfDay(new Date())
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const isOverdue = (bill: Bill) => {
  if (['paid', 'rejected', 'archived'].includes(bill.status)) return false
  const due = startOfDay(new Date(bill.dueDate))
  const today = startOfDay(new Date())
  return due < today
}

type AgingRow = {
  vendor: string
  current: number
  b0_30: number
  b31_60: number
  b61_90: number
  b90p: number
  total: number
}
type CashOutRow = { ymKey: string; month: string; total: number }

const CASH_OUT_MONTHS = 5

type AgingApiRow = {
  vendor: string
  current: number
  bucket_0_30: number
  bucket_31_60: number
  bucket_61_90: number
  bucket_90_plus: number
  total: number
}

function getBuckets(
  bills: Bill[],
  vendorById: Record<string, { name: string }>,
  unknownVendorLabel: string,
): AgingRow[] {
  const unpaidBills = bills.filter((bill) => !['paid', 'rejected', 'archived'].includes(bill.status))
  const map: Record<string, AgingRow> = {}
  const today = startOfDay(new Date())

  unpaidBills.forEach((bill) => {
    const vendorName = vendorById[bill.vendorId]?.name || unknownVendorLabel
    const due = startOfDay(new Date(bill.dueDate))
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    if (!map[vendorName]) {
      map[vendorName] = { vendor: vendorName, current: 0, b0_30: 0, b31_60: 0, b61_90: 0, b90p: 0, total: 0 }
    }
    if (diffDays <= 0) map[vendorName].current += bill.amount
    else if (diffDays <= 30) map[vendorName].b0_30 += bill.amount
    else if (diffDays <= 60) map[vendorName].b31_60 += bill.amount
    else if (diffDays <= 90) map[vendorName].b61_90 += bill.amount
    else map[vendorName].b90p += bill.amount
    map[vendorName].total += bill.amount
  })

  return Object.values(map).sort((a, b) => a.vendor.localeCompare(b.vendor))
}

function mapApiAging(rows: AgingApiRow[]): AgingRow[] {
  return rows.map((r) => ({
    vendor: r.vendor,
    current: r.current,
    b0_30: r.bucket_0_30,
    b31_60: r.bucket_31_60,
    b61_90: r.bucket_61_90,
    b90p: r.bucket_90_plus,
    total: r.total,
  }))
}

function paymentHeroSubtitle(
  bill: Bill | undefined,
  heroDays: number,
  heroOverdue: boolean,
  t: TranslateFn,
) {
  if (!bill) return t('dashboard.hero.noApprovedBill')
  if (heroOverdue) {
    const n = Math.abs(heroDays)
    return n === 1
      ? t('dashboard.hero.wasDueOverdueOne', { date: bill.dueDate })
      : t('dashboard.hero.wasDueOverdueMany', { date: bill.dueDate, count: n })
  }
  if (heroDays === 0) return t('dashboard.hero.dueToday')
  return heroDays === 1
    ? t('dashboard.hero.dueInOneDay')
    : t('dashboard.hero.dueInManyDays', { count: heroDays })
}

function getCashOutByMonth(bills: Bill[], locale: Locale): CashOutRow[] {
  const paid = bills.filter((bill) => bill.status === 'paid' && bill.paidDate)
  const map = new Map<string, number>()

  paid.forEach((bill) => {
    const date = new Date(bill.paidDate as string)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + bill.amount)
  })

  const now = new Date()
  const rows: CashOutRow[] = []
  const monthLocale = locale === 'es' ? 'es' : 'en-US'
  for (let i = CASH_OUT_MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const total = map.get(key) ?? 0
    rows.push({
      ymKey: key,
      month: d.toLocaleString(monthLocale, { month: 'short' }),
      total,
    })
  }
  return rows
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t, locale } = useTranslation()
  const summaryQuery = useDashboardSummaryQuery()
  const apQuery = useDashboardApAgingQuery()
  const billsQuery = useWorkspaceBillsQuery()
  const vendorsQuery = useWorkspaceVendorsQuery()

  const bills = useMemo(() => (billsQuery.data ?? []).map((raw) => mapApiBillToStore(raw)), [billsQuery.data])
  const vendors = vendorsQuery.data ?? []

  const vendorById = useMemo(() => Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor])), [vendors])

  const fallbackOverdueCount = bills.filter((bill) => isOverdue(bill)).length
  const fallbackPending = bills.filter((bill) => bill.status === 'pending_approval').length
  const now = new Date()
  const fallbackPaidThisMonth = bills
    .filter(
      (bill) =>
        bill.paidDate &&
        bill.status === 'paid' &&
        new Date(bill.paidDate).getMonth() === now.getMonth() &&
        new Date(bill.paidDate).getFullYear() === now.getFullYear(),
    )
    .reduce((sum, bill) => sum + bill.amount, 0)
  const fallbackTotalPayable = bills
    .filter((bill) => !['paid', 'rejected', 'archived'].includes(bill.status))
    .reduce((sum, bill) => sum + bill.amount, 0)

  const apiSummary = summaryQuery.data
  const totalPayable = apiSummary?.totalPayable ?? fallbackTotalPayable
  const pendingApprovalCount = apiSummary?.pendingApproval ?? fallbackPending
  const overdueCount = apiSummary?.overdue ?? fallbackOverdueCount
  const paidThisMonth = apiSummary?.paidThisMonth ?? fallbackPaidThisMonth

  const unknownVendor = t('dashboard.unknownVendor')
  const agingRows = useMemo(
    () => (apQuery.data ? mapApiAging(apQuery.data) : getBuckets(bills, vendorById, unknownVendor)),
    [apQuery.data, bills, vendorById, unknownVendor],
  )
  const recentBills = [...bills].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).slice(0, 5)
  const cashOutRows: CashOutRow[] = useMemo(() => getCashOutByMonth(bills, locale), [bills, locale])
  const maxCashOut = Math.max(...cashOutRows.map((row) => row.total), 1)
  const nextPaymentDue = [...bills]
    .filter((bill) => ['approved', 'scheduled'].includes(bill.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
  const heroDays = nextPaymentDue ? calendarDaysFromToday(nextPaymentDue.dueDate) : 0
  const heroOverdue = Boolean(nextPaymentDue && heroDays < 0)
  const requiringAction = [...bills]
    .filter(
      (bill) =>
        bill.status === 'pending_approval' ||
        (['approved', 'scheduled'].includes(bill.status) &&
          calendarDaysFromToday(bill.dueDate) >= 0 &&
          calendarDaysFromToday(bill.dueDate) <= 7) ||
        isOverdue(bill),
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6)

  const kpiFetching = summaryQuery.isFetching && summaryQuery.data
  const kpiInitialLoad = summaryQuery.isPending && !summaryQuery.data
  const apInitialLoad = apQuery.isPending && !apQuery.data
  const kpiClass = kpiFetching ? 'opacity-60 transition-opacity duration-200' : ''

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-5">
        <div className="hero-card rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[#f2fdff] via-[#e9fbff] to-[#d7f4fb] p-6 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {heroOverdue ? t('dashboard.hero.overduePayment') : t('dashboard.hero.nextPaymentDue')}
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            {currencyFormatter.format(nextPaymentDue?.amount ?? 0)}
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {nextPaymentDue ? vendorById[nextPaymentDue.vendorId]?.name : t('dashboard.hero.noUpcomingPayment')}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {paymentHeroSubtitle(nextPaymentDue, heroDays, heroOverdue, t)}
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/bills?tab=for_payment')}>{t('dashboard.hero.payNow')}</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{t('dashboard.action.title')}</h3>
            <span className="text-xs text-slate-500">
              {t('dashboard.action.itemCount', { count: requiringAction.length })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-slate-500">
                  <th className="px-3 py-2 text-left">{t('dashboard.col.invoice')}</th>
                  <th className="px-3 py-2 text-left">{t('dashboard.col.vendor')}</th>
                  <th className="px-3 py-2 text-left">{t('dashboard.col.due')}</th>
                  <th className="px-3 py-2 text-left">{t('dashboard.col.status')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.col.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {requiringAction.map((bill) => (
                  <tr key={bill.id} className="border-b border-[var(--color-border)]">
                    <td className="px-3 py-2 text-slate-700">{bill.invoiceNumber}</td>
                    <td className="px-3 py-2 text-slate-800">{vendorById[bill.vendorId]?.name}</td>
                    <td className="px-3 py-2 text-slate-500">{bill.dueDate}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={isOverdue(bill) ? 'overdue' : bill.status} />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">
                      {currencyFormatter.format(bill.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${kpiClass}`}>
        {kpiInitialLoad ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-9 w-32 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs text-slate-500">{t('dashboard.kpi.totalPayable')}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{currencyFormatter.format(totalPayable)}</p>
              <p className="mt-2 text-xs text-slate-400">{t('dashboard.kpi.openObligations')}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs text-slate-500">{t('dashboard.kpi.pendingApproval')}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingApprovalCount}</p>
              <p className="mt-2 text-xs text-slate-400">{t('dashboard.kpi.needsApproval')}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs text-slate-500">{t('dashboard.kpi.overdueBills')}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{overdueCount}</p>
              <p className="mt-2 text-xs text-red-500">{t('dashboard.kpi.highPriority')}</p>
            </div>
            <div className="paid-month-card rounded-2xl border border-[var(--color-border)] bg-gradient-to-r from-[#effaff] to-[#dbf5fc] p-4">
              <p className="text-xs text-slate-500">{t('dashboard.kpi.paidThisMonth')}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{currencyFormatter.format(paidThisMonth)}</p>
              <p className="mt-2 text-xs text-slate-500">{t('dashboard.kpi.greatCadence')}</p>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{t('dashboard.cashOut.title')}</h3>
          <span className="text-xs text-slate-500">{t('dashboard.cashOut.subtitle')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {cashOutRows.map((row) => {
            const height =
              row.total <= 0 ? 8 : Math.max(Math.round((row.total / maxCashOut) * 120), 12)
            return (
              <div key={row.ymKey} className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-3">
                <div className="mb-2 h-32 flex items-end">
                  <div
                    className="w-full rounded-md bg-[var(--color-primary)]"
                    style={{ height: `${height}px` }}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-700">{row.month}</p>
                <p className="text-xs text-slate-500">{currencyFormatter.format(row.total)}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section
        className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 ${
          apQuery.isFetching && apQuery.data ? 'opacity-60 transition-opacity duration-200' : ''
        }`}
      >
        <h3 className="mb-3 text-lg font-semibold text-slate-900">{t('dashboard.apAging.title')}</h3>
        {apInitialLoad ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-slate-500">
                  <th className="px-3 py-2 text-left">{t('dashboard.apAging.vendor')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.apAging.current')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.apAging.b0_30')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.apAging.b31_60')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.apAging.b61_90')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.apAging.b90')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.apAging.total')}</th>
                </tr>
              </thead>
              <tbody>
                {agingRows.map((row) => (
                  <tr key={row.vendor} className="border-b border-[var(--color-border)] text-slate-700">
                    <td className="px-3 py-2 font-medium">{row.vendor}</td>
                    <td className="px-3 py-2 text-right">{currencyFormatter.format(row.current)}</td>
                    <td className="px-3 py-2 text-right">{currencyFormatter.format(row.b0_30)}</td>
                    <td className="px-3 py-2 text-right">{currencyFormatter.format(row.b31_60)}</td>
                    <td className="px-3 py-2 text-right">{currencyFormatter.format(row.b61_90)}</td>
                    <td className="px-3 py-2 text-right">{currencyFormatter.format(row.b90p)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{currencyFormatter.format(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">{t('dashboard.recent.title')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-slate-500">
                <th className="px-3 py-2 text-left">{t('dashboard.recent.vendor')}</th>
                <th className="px-3 py-2 text-left">{t('dashboard.recent.status')}</th>
                <th className="px-3 py-2 text-left">{t('dashboard.recent.date')}</th>
                <th className="px-3 py-2 text-right">{t('dashboard.recent.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.map((bill) => (
                <tr key={bill.id} className="border-b border-[var(--color-border)]">
                  <td className="px-3 py-2 text-slate-800">{vendorById[bill.vendorId]?.name}</td>
                  <td className="px-3 py-2"><StatusBadge status={isOverdue(bill) ? 'overdue' : bill.status} /></td>
                  <td className="px-3 py-2 text-slate-500">{bill.dueDate}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">{currencyFormatter.format(bill.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
