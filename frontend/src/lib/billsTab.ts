export const BILLS_TAB_VALUES = ['drafts', 'for_approval', 'for_payment', 'history', 'archived'] as const
export type BillsTabValue = (typeof BILLS_TAB_VALUES)[number]

export type BillsNavState = { billsTab?: string }

export function parseBillsTab(value: unknown): BillsTabValue {
  if (typeof value === 'string' && (BILLS_TAB_VALUES as readonly string[]).includes(value)) {
    return value as BillsTabValue
  }
  return 'drafts'
}

/** List URL with ?tab= — defaults to drafts if missing/invalid */
export function billsListPath(tab: unknown): string {
  return `/bills?tab=${parseBillsTab(tab)}`
}
