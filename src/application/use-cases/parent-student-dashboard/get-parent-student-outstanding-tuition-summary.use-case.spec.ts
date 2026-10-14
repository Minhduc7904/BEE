import type { AuthenticatedUser, ParentStudentDashboardReadService, ParentUnpaidTuitionPayment } from '../../interfaces'
import { GetParentStudentOutstandingTuitionSummaryUseCase } from '.'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function payment(overrides: Partial<ParentUnpaidTuitionPayment> = {}): ParentUnpaidTuitionPayment {
  return { paymentId: 91, amount: 3000000, month: 9, year: 2026, ...overrides }
}

function service(payments: ParentUnpaidTuitionPayment[] = [], linked = true) {
  return {
    isStudentLinked: jest.fn().mockResolvedValue(linked),
    listUnpaidTuitionPayments: jest.fn().mockResolvedValue(payments),
  } as unknown as jest.Mocked<ParentStudentDashboardReadService>
}

// 05/10/2026 10:00 giờ Việt Nam
const now = new Date('2026-10-05T03:00:00.000Z')

function run(payments: ParentUnpaidTuitionPayment[], at: Date = now) {
  return new GetParentStudentOutstandingTuitionSummaryUseCase(service(payments)).execute(parentIdentity, 12, at)
}

describe('GetParentStudentOutstandingTuitionSummaryUseCase', () => {
  it('rejects a parent that is not linked to the student before reading payments', async () => {
    const reader = service([payment()], false)

    await expect(
      new GetParentStudentOutstandingTuitionSummaryUseCase(reader).execute(parentIdentity, 99, now),
    ).rejects.toHaveProperty('name', 'ForbiddenException')

    expect(reader.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(reader.listUnpaidTuitionPayments).not.toHaveBeenCalled()
  })

  it.each([
    ['student', { userType: 'student', studentId: 99 } as Partial<AuthenticatedUser>],
    ['admin', { userType: 'admin', adminId: 1 } as Partial<AuthenticatedUser>],
    ['parent without parentId', { parentId: undefined } as Partial<AuthenticatedUser>],
  ])('rejects %s identity', async (_, override) => {
    const reader = service([payment()])

    await expect(
      new GetParentStudentOutstandingTuitionSummaryUseCase(reader).execute({ ...parentIdentity, ...override }, 99, now),
    ).rejects.toHaveProperty('name', 'ForbiddenException')
    expect(reader.listUnpaidTuitionPayments).not.toHaveBeenCalled()
  })

  it('returns the documented empty summary when nothing is unpaid', async () => {
    await expect(run([])).resolves.toEqual({
      success: true,
      message: 'Không có học phí chưa đóng',
      data: {
        currency: 'VND',
        outstandingCount: 0,
        totalOutstandingAmount: 0,
        unknownAmountCount: 0,
        overdueCount: 0,
        nearestEffectiveDueDate: null,
        nearestDueDateSource: null,
        primaryPayment: null,
      },
    })
  })

  it('summarises several unpaid payments with an unknown amount (documented example)', async () => {
    const result = await run([
      payment({ paymentId: 91, amount: 3000000, month: 9, year: 2026 }),
      payment({ paymentId: 95, amount: null, month: 10, year: 2026 }),
    ])

    expect(result).toEqual({
      success: true,
      message: 'Lấy tổng hợp học phí chưa đóng thành công',
      data: {
        currency: 'VND',
        outstandingCount: 2,
        totalOutstandingAmount: 3000000,
        unknownAmountCount: 1,
        overdueCount: 1,
        nearestEffectiveDueDate: '2026-09-30T16:59:59.999Z',
        nearestDueDateSource: 'PERIOD_END',
        primaryPayment: {
          paymentId: 91,
          amount: 3000000,
          month: 9,
          year: 2026,
          effectiveDueDate: '2026-09-30T16:59:59.999Z',
          dueDateSource: 'PERIOD_END',
          isOverdue: true,
        },
      },
    })
  })

  it('adds amount 0 as a valid amount and does not count it as unknown', async () => {
    const result = await run([
      payment({ paymentId: 1, amount: 0 }),
      payment({ paymentId: 2, amount: 500000, month: 10 }),
    ])

    expect(result.data).toMatchObject({ outstandingCount: 2, totalOutstandingAmount: 500000, unknownAmountCount: 0 })
  })

  it('keeps an all-unknown month as primary payment with a null amount', async () => {
    const result = await run([payment({ paymentId: 95, amount: null, month: 10 })])

    expect(result.data).toMatchObject({
      totalOutstandingAmount: 0,
      unknownAmountCount: 1,
      primaryPayment: { paymentId: 95, amount: null },
    })
  })

  it('does not treat the current month as overdue before its end', async () => {
    const result = await run([payment({ paymentId: 95, month: 10, year: 2026 })])

    expect(result.data).toMatchObject({ overdueCount: 0, primaryPayment: { isOverdue: false } })
  })

  it('flips overdue exactly at 00:00 of the next month in Vietnam time', async () => {
    const octoberPayment = [payment({ paymentId: 95, month: 10, year: 2026 })]

    const lastMoment = await run(octoberPayment, new Date('2026-10-31T16:59:59.999Z'))
    const nextMoment = await run(octoberPayment, new Date('2026-10-31T17:00:00.000Z'))

    expect(lastMoment.data?.overdueCount).toBe(0)
    expect(nextMoment.data?.overdueCount).toBe(1)
  })

  it('ends February on the 29th in a leap year', async () => {
    const result = await run([payment({ paymentId: 7, month: 2, year: 2028 })], new Date('2028-01-15T00:00:00.000Z'))

    expect(result.data?.nearestEffectiveDueDate).toBe('2028-02-29T16:59:59.999Z')
  })

  it('ends a 31-day month on the 31st', async () => {
    const result = await run([payment({ paymentId: 7, month: 10, year: 2026 })])

    expect(result.data?.nearestEffectiveDueDate).toBe('2026-10-31T16:59:59.999Z')
  })

  it('picks the earliest due date as primary even when the input is not ordered', async () => {
    const result = await run([
      payment({ paymentId: 3, month: 10, year: 2026 }),
      payment({ paymentId: 9, month: 8, year: 2026 }),
      payment({ paymentId: 5, month: 12, year: 2025 }),
    ])

    expect(result.data?.primaryPayment).toMatchObject({ paymentId: 5, month: 12, year: 2025 })
  })

  it('breaks due-date ties by the smaller paymentId', async () => {
    const result = await run([
      payment({ paymentId: 8, month: 9, year: 2026 }),
      payment({ paymentId: 4, month: 9, year: 2026 }),
      payment({ paymentId: 6, month: 9, year: 2026 }),
    ])

    expect(result.data?.primaryPayment?.paymentId).toBe(4)
  })

  it('only reads UNPAID payments through the reader (PAID payments never reach the summary)', async () => {
    const reader = service([payment()])

    await new GetParentStudentOutstandingTuitionSummaryUseCase(reader).execute(parentIdentity, 12, now)

    expect(reader.listUnpaidTuitionPayments).toHaveBeenCalledWith(12)
  })
})
