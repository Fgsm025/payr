import { Cloud } from 'lucide-react'
import type { Bill, BillStatus } from '../../data/mockData'
import type { TranslateFn } from '../../i18n/useI18n'

type Row = Bill & { status: BillStatus; missingInfo?: boolean }

function formatErpRef(bill: Bill): string {
  if (bill.erpSyncRef) return bill.erpSyncRef
  if (bill.syncStatus === 'SUCCESS') {
    const n = [...bill.id].reduce((a, c) => a + (c.codePointAt(0) ?? 0), 0) % 9_000
    return String(1_000 + n)
  }
  return '----'
}

/**
 * Renders a single cloud icon; color and tooltip follow Prisma `syncStatus` and bill state
 * (rejected / missingInfo force failed styling for the MVP demo).
 */
export function renderErpSyncCell(row: Row, t: TranslateFn) {
  const ref = formatErpRef(row)
  const base = 'inline-flex items-center'

  if (row.status === 'rejected') {
    return (
      <span
        className={`${base} text-red-600`}
        title={t('bills.sync.failedVendorTax')}
      >
        <Cloud size={14} />
      </span>
    )
  }

  if (row.missingInfo) {
    return (
      <span
        className={`${base} text-red-600`}
        title={t('bills.sync.failedMissingGl')}
      >
        <Cloud size={14} />
      </span>
    )
  }

  if (row.syncStatus === 'SUCCESS') {
    return (
      <span className={`${base} text-emerald-600`} title={t('bills.sync.successQbo', { id: ref })}>
        <Cloud size={14} />
      </span>
    )
  }

  if (row.syncStatus === 'FAILED') {
    return (
      <span
        className={`${base} text-red-600`}
        title={t('bills.sync.failedGeneric')}
      >
        <Cloud size={14} />
      </span>
    )
  }

  const title =
    row.status === 'pending_approval' ? t('bills.sync.waitingApproval') : t('bills.sync.pendingErp')

  return (
    <span className={`${base} text-slate-400`} title={title}>
      <Cloud size={14} />
    </span>
  )
}
