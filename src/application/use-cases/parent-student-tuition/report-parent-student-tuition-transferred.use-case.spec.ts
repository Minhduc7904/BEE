import type { AuthenticatedUser, ParentTuitionPaymentDetailRecord } from '../../interfaces'
import { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import { TuitionPaymentStatus } from '../../../shared/enums'
import {
  BusinessLogicException,
  ForbiddenException,
  InvalidStateException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { ReportParentStudentTuitionTransferredUseCase } from './report-parent-student-tuition-transferred.use-case'

const NOW = new Date('2026-10-17T03:00:00.000Z')
const REPORTED_AT = new Date('2026-10-16T03:00:00.000Z')

const parent: AuthenticatedUser = {
  userId: 10,
  username: 'parent',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function payment(overrides: Partial<ConstructorParameters<typeof TuitionPayment>[0]> = {}): TuitionPayment {
  return new TuitionPayment({
    paymentId: 7,
    studentId: 12,
    amount: 1_500_000,
    status: TuitionPaymentStatus.UNPAID,
    month: 10,
    year: 2026,
    ...overrides,
  })
}

function detail(overrides: Partial<ParentTuitionPaymentDetailRecord> = {}): ParentTuitionPaymentDetailRecord {
  return {
    paymentId: 7,
    studentId: 12,
    month: 10,
    year: 2026,
    amount: 1_500_000,
    status: TuitionPaymentStatus.UNPAID,
    paidAt: null,
    payerReportedTransferredAt: null,
    paymentIntent: null,
    attempts: [],
    ...overrides,
  }
}

describe('ReportParentStudentTuitionTransferredUseCase', () => {
  const tuitionPaymentRepository = {
    findById: jest.fn(),
    reportPayerTransferred: jest.fn(),
  }
  const paymentIntentRepository = { findByTuitionPaymentId: jest.fn() }
  const paymentAttemptRepository = { findAll: jest.fn() }
  const unitOfWork = {
    executeInTransaction: jest.fn((work: (repos: unknown) => Promise<unknown>) =>
      work({ tuitionPaymentRepository, paymentIntentRepository, paymentAttemptRepository }),
    ),
  }
  const reader = { isStudentLinked: jest.fn(), findPaymentDetail: jest.fn() }
  const useCase = new ReportParentStudentTuitionTransferredUseCase(unitOfWork as never, reader as never)

  beforeEach(() => {
    jest.clearAllMocks()
    reader.isStudentLinked.mockResolvedValue(true)
    reader.findPaymentDetail.mockResolvedValue(detail({ payerReportedTransferredAt: NOW }))
    paymentIntentRepository.findByTuitionPaymentId.mockResolvedValue({ paymentIntentId: 3 })
    paymentAttemptRepository.findAll.mockResolvedValue([{ paymentAttemptId: 1 }])
    tuitionPaymentRepository.findById.mockResolvedValue(payment())
    tuitionPaymentRepository.reportPayerTransferred.mockResolvedValue(true)
  })

  it('writes the flag with the parent user id when the payment is unpaid and a QR was opened', async () => {
    const response = await useCase.execute(parent, 12, 7, NOW)

    expect(tuitionPaymentRepository.reportPayerTransferred).toHaveBeenCalledWith(7, 10, NOW)
    expect(response.data?.payerReportedTransferred).toBe(true)
    expect(response.data?.payerReportedTransferredAt).toBe(NOW.toISOString())
  })

  it('rejects a parent that does not manage the student before touching any payment', async () => {
    reader.isStudentLinked.mockResolvedValue(false)

    await expect(useCase.execute(parent, 12, 7, NOW)).rejects.toBeInstanceOf(ForbiddenException)
    expect(unitOfWork.executeInTransaction).not.toHaveBeenCalled()
  })

  it('treats a payment of another student as not found', async () => {
    tuitionPaymentRepository.findById.mockResolvedValue(payment({ studentId: 99 }))

    await expect(useCase.execute(parent, 12, 7, NOW)).rejects.toBeInstanceOf(NotFoundException)
    expect(tuitionPaymentRepository.reportPayerTransferred).not.toHaveBeenCalled()
  })

  it('is idempotent: an already reported payment is not written again', async () => {
    tuitionPaymentRepository.findById.mockResolvedValue(payment({ payerReportedTransferredAt: REPORTED_AT }))
    reader.findPaymentDetail.mockResolvedValue(detail({ payerReportedTransferredAt: REPORTED_AT }))

    const response = await useCase.execute(parent, 12, 7, NOW)

    expect(tuitionPaymentRepository.reportPayerTransferred).not.toHaveBeenCalled()
    expect(response.data?.payerReportedTransferredAt).toBe(REPORTED_AT.toISOString())
  })

  it('returns the PAID snapshot without writing when the payment is already paid', async () => {
    tuitionPaymentRepository.findById.mockResolvedValue(payment({ status: TuitionPaymentStatus.PAID }))
    reader.findPaymentDetail.mockResolvedValue(detail({ status: TuitionPaymentStatus.PAID, paidAt: NOW }))

    const response = await useCase.execute(parent, 12, 7, NOW)

    expect(tuitionPaymentRepository.reportPayerTransferred).not.toHaveBeenCalled()
    expect(response.data?.tuitionPaymentStatus).toBe(TuitionPaymentStatus.PAID)
    expect(response.data?.payerReportedTransferred).toBe(false)
  })

  it('requires at least one payment attempt, proving the QR screen was opened', async () => {
    paymentAttemptRepository.findAll.mockResolvedValue([])

    await expect(useCase.execute(parent, 12, 7, NOW)).rejects.toBeInstanceOf(BusinessLogicException)
    expect(tuitionPaymentRepository.reportPayerTransferred).not.toHaveBeenCalled()
  })

  it('requires an existing payment intent', async () => {
    paymentIntentRepository.findByTuitionPaymentId.mockResolvedValue(null)

    await expect(useCase.execute(parent, 12, 7, NOW)).rejects.toBeInstanceOf(BusinessLogicException)
    expect(paymentAttemptRepository.findAll).not.toHaveBeenCalled()
  })

  it.each([null, 0])('rejects a payment whose amount is %p', async (amount) => {
    tuitionPaymentRepository.findById.mockResolvedValue(payment({ amount }))

    await expect(useCase.execute(parent, 12, 7, NOW)).rejects.toBeInstanceOf(BusinessLogicException)
    expect(tuitionPaymentRepository.reportPayerTransferred).not.toHaveBeenCalled()
  })

  describe('race between the report and a concurrent transition', () => {
    beforeEach(() => {
      tuitionPaymentRepository.reportPayerTransferred.mockResolvedValue(false)
    })

    it('returns the PAID snapshot when the payment became PAID before the conditional update', async () => {
      reader.findPaymentDetail.mockResolvedValue(detail({ status: TuitionPaymentStatus.PAID, paidAt: NOW }))

      const response = await useCase.execute(parent, 12, 7, NOW)

      expect(response.data?.tuitionPaymentStatus).toBe(TuitionPaymentStatus.PAID)
      expect(response.data?.payerReportedTransferred).toBe(false)
    })

    it('returns the existing flag when a concurrent report won', async () => {
      reader.findPaymentDetail.mockResolvedValue(detail({ payerReportedTransferredAt: REPORTED_AT }))

      const response = await useCase.execute(parent, 12, 7, NOW)

      expect(response.data?.payerReportedTransferredAt).toBe(REPORTED_AT.toISOString())
    })

    it('fails with a business error when the payment is no longer reportable for another reason', async () => {
      reader.findPaymentDetail.mockResolvedValue(detail())

      await expect(useCase.execute(parent, 12, 7, NOW)).rejects.toBeInstanceOf(InvalidStateException)
    })
  })
})
