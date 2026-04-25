import React, { useMemo } from 'react'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { useAppStore } from '../store/useAppStore'
import type { Bill } from '../data/mockData'

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const isOverdue = (bill: Bill) => new Date(bill.dueDate) < new Date() && bill.status !== 'paid'

type AgingRow = { vendor: string; b0_30: number; b31_60: number; b61_90: number; b90p: number; total: number }

function getBuckets(bills: Bill[], vendorById: Record<string, { name: string }>): AgingRow[] {
  const unpaidBills = bills.filter((bill) => !['paid', 'rejected', 'archived'].includes(bill.status))
  const map: Record<string, AgingRow> = {}

  unpaidBills.forEach((bill) => {
    const vendorName = vendorById[bill.vendorId]?.name || 'Unknown'
    const diffDays = Math.floor((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    if (!map[vendorName]) map[vendorName] = { vendor: vendorName, b0_30: 0, b31_60: 0, b61_90: 0, b90p: 0, total: 0 }
    if (diffDays <= 30) map[vendorName].b0_30 += bill.amount
    else if (diffDays <= 60) map[vendorName].b31_60 += bill.amount
    else if (diffDays <= 90) map[vendorName].b61_90 += bill.amount
    else map[vendorName].b90p += bill.amount
    map[vendorName].total += bill.amount
  })

  return Object.values(map)
}

function getDaysUntil(date: string) {
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
  const bills = useAppStore((state) => state.bills)
  const vendors = useAppStore((state) => state.vendors)

  const vendorById = useMemo(() => Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor])), [vendors])

  const overdueCount = bills.filter((bill) => isOverdue(bill)).length
  const pendingApprovalCount = bills.filter((bill) => bill.status === 'pending_approval').length
  const now = new Date()
  const paidThisMonth = bills
    .filter(
      (bill) =>
        bill.paidDate &&
        bill.status === 'paid' &&
        new Date(bill.paidDate).getMonth() === now.getMonth() &&
        new Date(bill.paidDate).getFullYear() === now.getFullYear(),
    )
    .reduce((sum, bill) => sum + bill.amount, 0)

  const agingRows = getBuckets(bills, vendorById)
  const recentBills = [...bills].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).slice(0, 5)
  const nextPaymentDue = [...bills]
    .filter((bill) => ['approved', 'scheduled'].includes(bill.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
  const requiringAction = [...bills]
    .filter(
      (bill) =>
        bill.status === 'pending_approval' ||
        (['approved', 'scheduled'].includes(bill.status) && getDaysUntil(bill.dueDate) <= 7) ||
        isOverdue(bill),
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-5">
        <div className="hero-card rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[#f2fdff] via-[#e9fbff] to-[#d7f4fb] p-6 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your next payment due</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            {currencyFormatter.format(nextPaymentDue?.amount ?? 0)}
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {nextPaymentDue ? vendorById[nextPaymentDue.vendorId]?.name : 'No upcoming payment'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {nextPaymentDue
              ? `Due in ${Math.max(getDaysUntil(nextPaymentDue.dueDate), 0)} days`
              : 'No bill in approved or scheduled status'}
          </p>
          <div className="mt-6">
            <Button>Pay now</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Bills requiring action</h3>
            <span className="text-xs text-slate-500">{requiringAction.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-slate-500">
                  <th className="px-3 py-2 text-left">Invoice</th>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Due</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Amount</th>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs text-slate-500">Pending Approval</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingApprovalCount}</p>
          <p className="mt-2 text-xs text-slate-400">Needs approval action</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs text-slate-500">Overdue Bills</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{overdueCount}</p>
          <p className="mt-2 text-xs text-red-500">High priority follow-up</p>
        </div>
        <div className="paid-month-card rounded-2xl border border-[var(--color-border)] bg-gradient-to-r from-[#effaff] to-[#dbf5fc] p-4">
          <p className="text-xs text-slate-500">Paid This Month</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{currencyFormatter.format(paidThisMonth)}</p>
          <p className="mt-2 text-xs text-slate-500">Great payment cadence</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">AP Aging</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-slate-500">
                <th className="px-3 py-2 text-left">Vendor</th>
                <th className="px-3 py-2 text-right">0-30</th>
                <th className="px-3 py-2 text-right">31-60</th>
                <th className="px-3 py-2 text-right">61-90</th>
                <th className="px-3 py-2 text-right">90+</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {agingRows.map((row) => (
                <tr key={row.vendor} className="border-b border-[var(--color-border)] text-slate-700">
                  <td className="px-3 py-2 font-medium">{row.vendor}</td>
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
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Recent Bills</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-slate-500">
                <th className="px-3 py-2 text-left">Vendor</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Amount</th>
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
