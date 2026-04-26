import { formatApiPaymentMethod } from './paymentMethodLabel'

describe('formatApiPaymentMethod', () => {
  it('maps Prisma-style enums to labels', () => {
    expect(formatApiPaymentMethod('ach')).toBe('ACH')
    expect(formatApiPaymentMethod('wire')).toBe('Wire Transfer')
    expect(formatApiPaymentMethod('check')).toBe('Check')
  })

  it('falls back to Bank Transfer', () => {
    expect(formatApiPaymentMethod('')).toBe('Bank Transfer')
    expect(formatApiPaymentMethod('unknown')).toBe('Bank Transfer')
  })
})
