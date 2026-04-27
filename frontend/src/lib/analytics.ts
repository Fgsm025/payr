import posthog from 'posthog-js'

export type BillLifecycleEvent =
  | 'bill_created'
  | 'bill_submitted'
  | 'bill_approved'
  | 'bill_rejected'
  | 'bill_paid'

export const trackEvent = (eventName: BillLifecycleEvent, properties?: object) => {
  posthog.capture(eventName, properties)
}
