import { TuitionPaymentStatus } from '../../shared/enums'
import type { PrismaService } from '../../prisma/prisma.service'
import { PrismaParentStudentTuitionReadService } from './parent-student-tuition-read.service'

const row = (paymentId: number, year: number, month: number) => ({
  paymentId,
  studentId: 12,
  month,
  year,
  amount: 1_000_000,
  status: 'UNPAID',
  paidAt: null,
  payerReportedTransferredAt: null,
})

function serviceWith(findMany: jest.Mock, findFirst: jest.Mock = jest.fn()) {
  return new PrismaParentStudentTuitionReadService({
    tuitionPayment: { findMany, findFirst },
  } as unknown as PrismaService)
}

describe('PrismaParentStudentTuitionReadService', () => {
  it('isStudentLinked checks the parent-student link', async () => {
    const findUnique = jest.fn().mockResolvedValueOnce({ studentId: 12 }).mockResolvedValueOnce(null)
    const service = new PrismaParentStudentTuitionReadService({
      parentStudent: { findUnique },
    } as unknown as PrismaService)

    await expect(service.isStudentLinked(20, 12)).resolves.toBe(true)
    await expect(service.isStudentLinked(20, 99)).resolves.toBe(false)
  })

  describe('listPayments', () => {
    it('orders UNPAID oldest period first and walks forward from the cursor', async () => {
      const findMany = jest.fn().mockResolvedValue([])

      await serviceWith(findMany).listPayments(12, {
        status: TuitionPaymentStatus.UNPAID,
        after: { year: 2026, month: 9, paymentId: 41 },
        limit: 10,
      })

      const args = findMany.mock.calls[0][0]
      expect(args.orderBy).toEqual([{ year: 'asc' }, { month: 'asc' }, { paymentId: 'asc' }])
      expect(args.take).toBe(11)
      expect(args.where).toEqual({
        studentId: 12,
        status: 'UNPAID',
        OR: [{ year: { gt: 2026 } }, { year: 2026, month: { gt: 9 } }, { year: 2026, month: 9, paymentId: { gt: 41 } }],
      })
    })

    it('orders PAID newest period first and walks backward from the cursor', async () => {
      const findMany = jest.fn().mockResolvedValue([])

      await serviceWith(findMany).listPayments(12, {
        status: TuitionPaymentStatus.PAID,
        after: { year: 2026, month: 9, paymentId: 41 },
        limit: 5,
      })

      const args = findMany.mock.calls[0][0]
      expect(args.orderBy).toEqual([{ year: 'desc' }, { month: 'desc' }, { paymentId: 'desc' }])
      expect(args.where.OR[0]).toEqual({ year: { lt: 2026 } })
    })

    it('does not filter by cursor on the first page', async () => {
      const findMany = jest.fn().mockResolvedValue([])

      await serviceWith(findMany).listPayments(12, { status: TuitionPaymentStatus.UNPAID, after: null, limit: 10 })

      expect(findMany.mock.calls[0][0].where).toEqual({ studentId: 12, status: 'UNPAID' })
    })

    it('trims the extra row, reports hasNext and encodes the last returned row as the cursor', async () => {
      const findMany = jest.fn().mockResolvedValue([row(1, 2026, 8), row(2, 2026, 9), row(3, 2026, 10)])

      const page = await serviceWith(findMany).listPayments(12, {
        status: TuitionPaymentStatus.UNPAID,
        after: null,
        limit: 2,
      })

      expect(page.data.map((payment) => payment.paymentId)).toEqual([1, 2])
      expect(page.hasNext).toBe(true)
      expect(page.nextCursor).toBe('2026_9_2')
    })

    it('has no next cursor on the last page', async () => {
      const findMany = jest.fn().mockResolvedValue([row(1, 2026, 8)])

      const page = await serviceWith(findMany).listPayments(12, {
        status: TuitionPaymentStatus.UNPAID,
        after: null,
        limit: 2,
      })

      expect(page).toMatchObject({ hasNext: false, nextCursor: null })
    })
  })

  describe('findPaymentDetail', () => {
    it('scopes the lookup to the student and selects only safe attempt fields', async () => {
      const findFirst = jest.fn().mockResolvedValue(null)

      await expect(serviceWith(jest.fn(), findFirst).findPaymentDetail(12, 7)).resolves.toBeNull()

      const args = findFirst.mock.calls[0][0]
      expect(args.where).toEqual({ paymentId: 7, studentId: 12 })
      const attemptSelect = args.select.paymentIntent.select.attempts.select
      expect(Object.keys(attemptSelect).sort()).toEqual(
        ['amount', 'attemptCode', 'confirmationMode', 'createdAt', 'expiresAt', 'paymentAttemptId', 'status'].sort(),
      )
      expect(args.select.paymentIntent.select.attempts.orderBy).toEqual([
        { createdAt: 'desc' },
        { paymentAttemptId: 'desc' },
      ])
    })

    it('returns a null intent and no attempts for a payment that never opened a QR', async () => {
      const findFirst = jest.fn().mockResolvedValue({ ...row(7, 2026, 10), paymentIntent: null })

      const detail = await serviceWith(jest.fn(), findFirst).findPaymentDetail(12, 7)

      expect(detail).toMatchObject({ paymentId: 7, paymentIntent: null, attempts: [] })
    })
  })
})
