type TableSkeletonProps = Readonly<{
  rows?: number
  cols?: number
  className?: string
}>

export default function TableSkeleton({ rows = 6, cols = 5, className = '' }: TableSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }, (_, j) => (
            <div
              key={j}
              className="h-9 flex-1 min-w-[4rem] animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/50"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
