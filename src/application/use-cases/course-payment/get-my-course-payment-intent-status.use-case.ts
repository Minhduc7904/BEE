import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BankTransferTransactionType } from '../../../shared/enums'

@Injectable()
export class GetMyCoursePaymentIntentStatusUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(paymentIntentId: number, studentId: number) {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const intent = await repos.paymentIntentRepository.findById(paymentIntentId)
      if (!intent || intent.type !== BankTransferTransactionType.COURSE_PURCHASE || !intent.courseEnrollmentId) {
        throw new NotFoundException('Không tìm thấy thanh toán khóa học')
      }
      const enrollment = await repos.courseEnrollmentRepository.findById(intent.courseEnrollmentId)
      if (!enrollment || enrollment.studentId !== studentId)
        throw new NotFoundException('Không tìm thấy thanh toán khóa học')
      const attempt = await repos.paymentAttemptRepository.findLatestPendingByPaymentIntent(intent.paymentIntentId)
      return {
        paymentIntentId: intent.paymentIntentId,
        courseEnrollmentId: enrollment.enrollmentId,
        enrollmentStatus: enrollment.status,
        intentStatus: intent.status,
        latestPaymentAttemptStatus: attempt?.status ?? null,
        paidAt: intent.status === 'PAID' ? intent.updatedAt : null,
        intentUpdatedAt: intent.updatedAt,
      }
    })
  }

  async executeForUser(paymentIntentId: number, userId: number) {
    const student = await this.unitOfWork.executeInTransaction((repos) => repos.studentRepository.findByUserId(userId))
    if (!student) throw new NotFoundException('Không tìm thấy thanh toán khóa học')
    return this.execute(paymentIntentId, student.studentId)
  }
}
