import { DueDateSource } from '../../../shared/enums/due-date-source.enum'
import { TuitionPaymentStatus } from '../../../shared/enums/tuition-payment-status.enum'
import { TuitionPayment } from './tuition-payment.entity'
import { isTuitionOverdue, resolveTuitionDueDate } from './tuition-payment-due-date'

describe('resolveTuitionDueDate', () => {
  it('falls back to 23:59:59.999 on the last day of the month in Vietnam time', () => {
    const result = resolveTuitionDueDate({ month: 9, year: 2026, explicitDueDate: null })

    expect(result.effectiveDueDate.toISOString()).toBe('2026-09-30T16:59:59.999Z')
    expect(result.source).toBe(DueDateSource.PERIOD_END)
  })

  it('treats a missing explicitDueDate like null', () => {
    expect(resolveTuitionDueDate({ month: 9, year: 2026 }).source).toBe(DueDateSource.PERIOD_END)
  })

  it('ends February on the 29th in a leap year and the 28th otherwise', () => {
    expect(resolveTuitionDueDate({ month: 2, year: 2028 }).effectiveDueDate.toISOString()).toBe(
      '2028-02-29T16:59:59.999Z',
    )
    expect(resolveTuitionDueDate({ month: 2, year: 2027 }).effectiveDueDate.toISOString()).toBe(
      '2027-02-28T16:59:59.999Z',
    )
  })

  it('prefers a future explicit due date with source EXPLICIT', () => {
    const explicitDueDate = new Date('2026-12-15T10:00:00.000Z')

    const result = resolveTuitionDueDate({ month: 9, year: 2026, explicitDueDate })

    expect(result.effectiveDueDate).toBe(explicitDueDate)
    expect(result.source).toBe(DueDateSource.EXPLICIT)
  })

  it('prefers an explicit due date that is earlier than the period end', () => {
    const explicitDueDate = new Date('2026-09-10T00:00:00.000Z')

    expect(resolveTuitionDueDate({ month: 9, year: 2026, explicitDueDate }).effectiveDueDate).toBe(explicitDueDate)
  })
})

describe('isTuitionOverdue', () => {
  const dueDate = new Date('2026-09-30T16:59:59.999Z')

  it('is not overdue at the exact due timestamp', () => {
    expect(isTuitionOverdue(dueDate, new Date('2026-09-30T16:59:59.999Z'))).toBe(false)
  })

  it('is overdue one millisecond after the due timestamp (00:00 of the next month in Vietnam)', () => {
    expect(isTuitionOverdue(dueDate, new Date('2026-09-30T17:00:00.000Z'))).toBe(true)
  })
})

describe('TuitionPayment.isOverdue', () => {
  function payment(overrides: Partial<ConstructorParameters<typeof TuitionPayment>[0]> = {}) {
    return new TuitionPayment({
      paymentId: 1,
      studentId: 2,
      status: TuitionPaymentStatus.UNPAID,
      month: 9,
      year: 2026,
      ...overrides,
    })
  }

  it('uses the same due date as the resolver', () => {
    expect(payment().isOverdue(new Date('2026-09-30T16:59:59.999Z'))).toBe(false)
    expect(payment().isOverdue(new Date('2026-09-30T17:00:00.000Z'))).toBe(true)
  })

  it('is not overdue before the end of the current month', () => {
    expect(payment({ month: 10 }).isOverdue(new Date('2026-10-05T03:00:00.000Z'))).toBe(false)
  })

  it('is never overdue once paid', () => {
    expect(payment({ status: TuitionPaymentStatus.PAID }).isOverdue(new Date('2030-01-01T00:00:00.000Z'))).toBe(false)
  })
})
