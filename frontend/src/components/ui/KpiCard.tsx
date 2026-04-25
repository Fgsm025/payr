import type { LucideIcon } from 'lucide-react'

export default function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendTone = 'neutral',
}: {
  icon: LucideIcon
  label: string
  value: string
  trend: string
  trendTone?: 'neutral' | 'positive' | 'negative'
}) {
  const trendStyle = {
    neutral: 'text-slate-500',
    positive: 'text-emerald-600',
    negative: 'text-red-500',
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <Icon size={18} className="text-slate-400" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className={`mt-1 text-xs ${trendStyle[trendTone]}`}>{trend}</p>
    </div>
  )
}
