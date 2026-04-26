export function formatApiPaymentMethod(method: string): string {
  switch (method) {
    case 'ach':
      return 'ACH'
    case 'wire':
      return 'Wire Transfer'
    case 'check':
      return 'Check'
    default:
      return 'Bank Transfer'
  }
}
