import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import {
  BankTransferProcessingStatus,
  BankTransferReconciliationStatus,
  BankTransferTransactionType,
  CourseEnrollmentStatus,
  CourseEnrollmentType,
  PaymentAttemptStatus,
  PaymentIntentStatus,
} from '../../../shared/enums'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums'

@Injectable()
export class ConfirmManualCoursePaymentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    courseEnrollmentId: number,
    bankTransferTransactionId: number,
    adminId: number,
  ): Promise<BaseResponseDto<null>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const enrollment = await repos.courseEnrollmentRepository.findById(courseEnrollmentId)
      const intent = await repos.paymentIntentRepository.findByCourseEnrollmentId(courseEnrollmentId)
      const transaction = await repos.bankTransferTransactionRepository.findById(bankTransferTransactionId)
      if (!enrollment || !intent || !transaction)
        throw new NotFoundException('Không tìm thấy dữ liệu đối soát khóa học')
      if (enrollment.type !== CourseEnrollmentType.ONLINE_PURCHASE) {
        throw new BadRequestException('Chỉ enrollment mua course online mới được đối soát thủ công')
      }
      if (
        intent.status !== PaymentIntentStatus.PENDING ||
        transaction.reconciliationStatus !== BankTransferReconciliationStatus.UNRECONCILED
      ) {
        throw new BadRequestException('Thanh toán không còn ở trạng thái có thể xác nhận')
      }
      if (transaction.type && transaction.type !== BankTransferTransactionType.COURSE_PURCHASE) {
        throw new BadRequestException('Giao dịch thuộc mục đích thanh toán khác')
      }
      const attempt = await repos.paymentAttemptRepository.findLatestPendingByPaymentIntent(intent.paymentIntentId)
      if (
        !attempt ||
        transaction.amount !== attempt.amount ||
        transaction.receivingBankAccountId !== attempt.receivingBankAccountId
      ) {
        throw new BadRequestException('Giao dịch không đúng tài khoản hoặc số tiền phải thanh toán')
      }
      await repos.paymentAttemptRepository.update(attempt.paymentAttemptId, { status: PaymentAttemptStatus.SUCCEEDED })
      await repos.paymentIntentRepository.update(intent.paymentIntentId, { status: PaymentIntentStatus.PAID })
      await repos.courseEnrollmentRepository.update(enrollment.enrollmentId, {
        status: CourseEnrollmentStatus.ACTIVE,
        isPaidFull: true,
      })
      await repos.bankTransferTransactionRepository.updateReconciliation(transaction.bankTransferTransactionId, {
        paymentAttemptId: attempt.paymentAttemptId,
        processingStatus: BankTransferProcessingStatus.MATCHED,
        reconciliationStatus: BankTransferReconciliationStatus.ADMIN,
        type: BankTransferTransactionType.COURSE_PURCHASE,
      })
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.COURSE_ENROLLMENT.UPDATE,
        resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
        resourceId: String(enrollment.enrollmentId),
        status: AuditStatus.SUCCESS,
        afterData: {
          paymentIntentId: intent.paymentIntentId,
          paymentAttemptId: attempt.paymentAttemptId,
          bankTransferTransactionId: transaction.bankTransferTransactionId,
          reconciliation: BankTransferReconciliationStatus.ADMIN,
          type: BankTransferTransactionType.COURSE_PURCHASE,
        },
      })
    })
    return BaseResponseDto.success('Xác nhận thanh toán khóa học thành công', null)
  }
}
