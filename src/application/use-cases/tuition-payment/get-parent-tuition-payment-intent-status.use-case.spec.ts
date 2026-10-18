import { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import { PaymentIntent } from '../../../domain/entities/tuition-online-payment'
import { PaymentIntentStatus, TuitionPaymentStatus } from '../../../shared/enums'
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '../../../shared/exceptions/custom-exceptions'
import { GetParentTuitionPaymentIntentStatusUseCase } from './get-parent-tuition-payment-intent-status.use-case'

describe('GetParentTuitionPaymentIntentStatusUseCase', () => {
  const repos = {
    paymentIntentRepository: { findById: jest.fn() },
    tuitionPaymentRepository: { findById: jest.fn() },
    parentStudentRepository: { exists: jest.fn() },
  }
  const unitOfWork = { executeInTransaction: jest.fn((work: (r: unknown) => Promise<unknown>) => work(repos)) }
  const useCase = new GetParentTuitionPaymentIntentStatusUseCase(unitOfWork as never)

  beforeEach(() => {
    jest.clearAllMocks()
    repos.paymentIntentRepository.findById.mockResolvedValue(
      new PaymentIntent({
        paymentIntentId: 15,
        tuitionPaymentId: 201,
        amount: 1_500_000,
        status: PaymentIntentStatus.PENDING,
      }),
    )
    repos.tuitionPaymentRepository.findById.mockResolvedValue(
      new TuitionPayment({
        paymentId: 201,
        studentId: 12,
        amount: 1_500_000,
        status: TuitionPaymentStatus.UNPAID,
        month: 10,
        year: 2026,
      }),
    )
    repos.parentStudentRepository.exists.mockResolvedValue(true)
  })

  it('returns the snapshot and the student id for a parent linked to the student', async () => {
    const result = await useCase.getByPaymentIntentId(15, 20)

    expect(repos.parentStudentRepository.exists).toHaveBeenCalledWith(20, 12)
    expect(result.studentId).toBe(12)
    expect(result.intent).toMatchObject({
      paymentIntentId: 15,
      tuitionPaymentId: 201,
      tuitionPaymentStatus: 'UNPAID',
      intentStatus: 'PENDING',
    })
  })

  it('rejects a parent that is not linked to the student of the payment', async () => {
    repos.parentStudentRepository.exists.mockResolvedValue(false)

    await expect(useCase.getByPaymentIntentId(15, 21)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejects a missing parent id', async () => {
    await expect(useCase.getByPaymentIntentId(15, undefined)).rejects.toBeInstanceOf(UnauthorizedException)
    expect(unitOfWork.executeInTransaction).not.toHaveBeenCalled()
  })

  it('rejects an unknown intent and an intent that is not a tuition payment', async () => {
    repos.paymentIntentRepository.findById.mockResolvedValueOnce(null)
    await expect(useCase.getByPaymentIntentId(15, 20)).rejects.toBeInstanceOf(NotFoundException)

    repos.paymentIntentRepository.findById.mockResolvedValueOnce(
      new PaymentIntent({ paymentIntentId: 16, courseEnrollmentId: 5, amount: 1, status: PaymentIntentStatus.PENDING }),
    )
    await expect(useCase.getByPaymentIntentId(16, 20)).rejects.toBeInstanceOf(NotFoundException)
  })
})
