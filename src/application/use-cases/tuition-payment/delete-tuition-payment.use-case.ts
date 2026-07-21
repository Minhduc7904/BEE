import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories/unit-of-work.repository'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { ForbiddenException, InvalidStateException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import {
  BankTransferProcessingStatus,
  BankTransferReconciliationStatus,
  NotificationType,
  NotificationLevel,
  TuitionPaymentStatus,
} from 'src/shared/enums'

@Injectable()
export class DeleteTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
  ) {}

  async execute(paymentId: number, adminId?: number): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPaymentRepository = repos.tuitionPaymentRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const existing = await tuitionPaymentRepository.findById(paymentId)

      if (!existing) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.TUITION_PAYMENT.DELETE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
            resourceId: paymentId.toString(),
            errorMessage: `Học phí với ID ${paymentId} không tồn tại`,
          })
        }
        throw new NotFoundException(`Học phí với ID ${paymentId} không tồn tại`)
      }

      if (existing.status === TuitionPaymentStatus.PAID) {
        throw new InvalidStateException('Không thể xóa học phí đã thanh toán')
      }

      // Kiểm tra student active
      const paymentStudent = await repos.studentRepository.findById(existing.studentId)
      if (paymentStudent && !paymentStudent.user?.isActive) {
        throw new ForbiddenException('Học sinh đã bị vô hiệu hóa, không thể xóa học phí')
      }

      await this.deleteOnlinePaymentData(repos, paymentId)
      const deleted = await tuitionPaymentRepository.delete(paymentId)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_PAYMENT.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
          resourceId: paymentId.toString(),
          beforeData: existing,
        })
      }
      // Gửi thông báo cho học sinh
      const student = await repos.studentRepository.findById(existing.studentId)
      if (student) {
        this.createAndNotifyOne
          .execute({
            userId: student.userId,
            title: 'Xóa học phí',
            message: `Học phí tháng ${existing.month}/${existing.year} đã bị xóa`,
            type: NotificationType.TUITION,
            level: NotificationLevel.WARNING,
            data: { month: existing.month, year: existing.year },
          })
          .catch(() => {
            /* ignore notification error */
          })
      }

      return { deleted }
    })

    return BaseResponseDto.success('Xóa học phí thành công', result)
  }

  private async deleteOnlinePaymentData(repos: UnitOfWorkRepos, tuitionPaymentId: number): Promise<void> {
    const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
    if (!paymentIntent) {
      return
    }

    const paymentAttempts = await repos.paymentAttemptRepository.findAll({
      paymentIntentId: paymentIntent.paymentIntentId,
    })

    if (paymentAttempts.length > 0) {
      const bankTransferTransactions = await repos.bankTransferTransactionRepository.findAll({
        paymentAttemptIds: paymentAttempts.map((paymentAttempt) => paymentAttempt.paymentAttemptId),
      })

      for (const bankTransferTransaction of bankTransferTransactions) {
        await repos.bankTransferTransactionRepository.updateReconciliation(
          bankTransferTransaction.bankTransferTransactionId,
          {
            paymentAttemptId: null,
            processingStatus: BankTransferProcessingStatus.RECEIVED,
            ...(bankTransferTransaction.reconciliationStatus !== BankTransferReconciliationStatus.UNRECONCILED && {
              reconciliationStatus: BankTransferReconciliationStatus.UNRECONCILED,
            }),
          },
        )
      }

      await repos.paymentAttemptRepository.deleteByPaymentIntentId(paymentIntent.paymentIntentId)
    }

    await repos.paymentIntentRepository.delete(paymentIntent.paymentIntentId)
  }
}
