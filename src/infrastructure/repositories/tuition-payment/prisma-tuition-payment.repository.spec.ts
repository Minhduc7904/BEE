import { TuitionPaymentStatus } from '../../../shared/enums'
import { PrismaTuitionPaymentRepository } from './prisma-tuition-payment.repository'

const PAID_AT = new Date('2026-10-17T03:00:00.000Z')

describe('PrismaTuitionPaymentRepository payer-reported transfer flag', () => {
  const tuitionPayment = {
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  }
  const repository = new PrismaTuitionPaymentRepository({ tuitionPayment })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('markPaid', () => {
    it('sets PAID and clears the payer-reported flag in the same UPDATE statement', async () => {
      tuitionPayment.update.mockResolvedValue({
        paymentId: 7,
        studentId: 12,
        month: 10,
        year: 2026,
        status: 'PAID',
        paidAt: PAID_AT,
        payerReportedTransferredAt: null,
        payerReportedTransferredByUserId: null,
      })

      const result = await repository.markPaid(7, { paidAt: PAID_AT })

      expect(tuitionPayment.update).toHaveBeenCalledTimes(1)
      const args = tuitionPayment.update.mock.calls[0][0]
      expect(args.where).toEqual({ paymentId: 7 })
      expect(args.data).toEqual({
        status: TuitionPaymentStatus.PAID,
        paidAt: PAID_AT,
        payerReportedTransferredAt: null,
        payerReportedTransferredByUserId: null,
      })
      expect(result?.status).toBe(TuitionPaymentStatus.PAID)
      expect(result?.hasPayerReportedTransfer()).toBe(false)
    })

    it('only overwrites notes when new notes are given', async () => {
      tuitionPayment.update.mockResolvedValue({ paymentId: 7, studentId: 12, month: 10, year: 2026, status: 'PAID' })

      await repository.markPaid(7, { paidAt: PAID_AT, notes: 'Xác nhận thủ công' })

      expect(tuitionPayment.update.mock.calls[0][0].data.notes).toBe('Xác nhận thủ công')
    })
  })

  describe('reportPayerTransferred', () => {
    it('writes the flag only for an UNPAID, unreported payment with a positive amount', async () => {
      tuitionPayment.updateMany.mockResolvedValue({ count: 1 })

      const written = await repository.reportPayerTransferred(7, 10, PAID_AT)

      expect(written).toBe(true)
      expect(tuitionPayment.updateMany).toHaveBeenCalledWith({
        where: {
          paymentId: 7,
          status: TuitionPaymentStatus.UNPAID,
          payerReportedTransferredAt: null,
          amount: { gt: 0 },
        },
        data: { payerReportedTransferredAt: PAID_AT, payerReportedTransferredByUserId: 10 },
      })
    })

    it('returns false when the conditional update matched no row (already PAID or already reported)', async () => {
      tuitionPayment.updateMany.mockResolvedValue({ count: 0 })

      await expect(repository.reportPayerTransferred(7, 10, PAID_AT)).resolves.toBe(false)
    })
  })

  describe('findAllWithPagination admin filter', () => {
    beforeEach(() => {
      tuitionPayment.findMany.mockResolvedValue([])
      tuitionPayment.count.mockResolvedValue(0)
    })

    it.each([
      [true, { not: null }],
      [false, null],
    ])('filters payerReportedTransferred=%s on the report time column', async (flag, expected) => {
      await repository.findAllWithPagination(
        { page: 1, limit: 10, sortBy: 'payerReportedTransferredAt', sortOrder: 'desc' },
        { payerReportedTransferred: flag },
      )

      const args = tuitionPayment.findMany.mock.calls[0][0]
      expect(args.where.payerReportedTransferredAt).toEqual(expected)
      expect(args.orderBy).toEqual([{ payerReportedTransferredAt: 'desc' }, { paymentId: 'desc' }])
    })

    it('adds no report condition when the filter is omitted', async () => {
      await repository.findAllWithPagination({ page: 1, limit: 10 }, {})

      expect(tuitionPayment.findMany.mock.calls[0][0].where).not.toHaveProperty('payerReportedTransferredAt')
    })
  })
})
