import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import EmptyState from './EmptyState'
import Button from './Button'

type Column<T> = {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
}: {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
}) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    const { key, direction } = sortConfig
    return [...data].sort((a, b) => {
      const left = a[key]
      const right = b[key]
      if (left === right) return 0
      const comparison = left! > right! ? 1 : -1
      return direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const onSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  if (!sortedData.length) {
    return <EmptyState title="No rows found" description="Try adjusting filters or add new records." />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700">
                  {col.sortable ? (
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 px-0 py-0" onClick={() => onSort(col.key)}>
                      {col.label}
                      {sortConfig?.key === col.key && sortConfig.direction === 'asc' ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} className="opacity-60" />
                      )}
                    </Button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {sortedData.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={`${rowKey(row)}-${col.key}`} className="px-4 py-3 text-slate-700">
                    {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
