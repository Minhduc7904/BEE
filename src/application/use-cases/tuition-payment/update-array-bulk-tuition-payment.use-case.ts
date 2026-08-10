import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { BaseResponseDto, TuitionPaymentResponseDto } from 'src/application/dtos'
import { UpdateArrayBulkTuitionPaymentDto } from 'src/application/dtos/tuition-payment/update-array-bulk-tuition-payment.dto'
import type { IUnitOfWork } from 'src/domain/repositories'
import {
  InvalidStateException,
  NotFoundException,
  UnauthorizedException,
} from 'src/shared/exceptions/custom-exceptions'
import {
  AuditStatus,
  NotificationLevel,
  NotificationType,
  PaymentAttemptStatus,
  PaymentIntentStatus,
  TuitionPaymentStatus,
  TuitionPaymentStatusLabels,
} from 'src/shared/enums'
import { RESOURCE_TYPES, ACTION_KEYS } from 'src/shared/constants'
import { UpdateTuitionPaymentData } from 'src/domain/interface'
import { TuitionPayment } from 'src/domain/entities/tuition-payment/tuition-payment.entity'
import { CreateAndNotifyManyUseCase } from '../notification/create-and-notify-many.use-case'
import { CreatePaymentIntentForCreatedTuitionPayment } from '../payment-intent/create-payment-intent-for-created-tuition-payment'
import { SendBulkTuitionPaymentToParentUseCase } from './send-bulk-tuition-payment-to-parent.use-case'
import { ManualTuitionPaymentReconciliationService } from './manual-tuition-payment-reconciliation.service'

const EXPIRED_ATTEMPT_OFFSET_MS = 1000

@Injectable()
export class UpdateArrayBulkTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyMany: CreateAndNotifyManyUseCase,
    private readonly sendBulkTuitionPaymentToParentUseCase: SendBulkTuitionPaymentToParentUseCase,
    private readonly manualReconciliation: ManualTuitionPaymentReconciliationService,
  ) {}

  /**
   * Helper: Strip time from date (set to 00:00:00)
   */
  private getDateWithoutTime(date: Date = new Date()): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  async execute(
    dto: UpdateArrayBulkTuitionPaymentDto,
    adminId: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto[]>> {
    if (!adminId) {
      throw new UnauthorizedException('Admin không hợp lệ')
    }

    const result = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const { tuitionPaymentRepository, adminAuditLogRepository } = repos

        try {
          const results: {
            updated: TuitionPayment[]
            failed: any[]
            parentNotifyPaymentIds: number[]
          } = {
            updated: [],
            failed: [],
            parentNotifyPaymentIds: [],
          }

          /**
           * =========================
           * Process each payment
           * =========================
           */
          for (const paymentUpdate of dto.payments) {
            try {
              const tuitionPayment = await tuitionPaymentRepository.findById(paymentUpdate.paymentId)

              if (!tuitionPayment) {
                results.failed.push({
                  paymentId: paymentUpdate.paymentId,
                  reason: 'Học phí không tồn tại',
                })
                continue
              }

              // Kiểm tra student active
              const paymentStudent = await repos.studentRepository.findById(tuitionPayment.studentId)
              if (paymentStudent && !paymentStudent.user?.isActive) {
                continue
              }

              /**
               * =========================
               * Build update data
               * =========================
               */
              const data: UpdateTuitionPaymentData = { notes: paymentUpdate.notes }
              const statusChangedToPaid =
                paymentUpdate.status === TuitionPaymentStatus.PAID &&
                tuitionPayment.status !== TuitionPaymentStatus.PAID
              const statusChangedToUnpaid =
                paymentUpdate.status === TuitionPaymentStatus.UNPAID &&
                tuitionPayment.status === TuitionPaymentStatus.PAID
              const isAmountChanged =
                paymentUpdate.amount !== undefined && paymentUpdate.amount !== tuitionPayment.amount
              if (isAmountChanged && tuitionPayment.status === TuitionPaymentStatus.PAID && !statusChangedToUnpaid) {
                throw new InvalidStateException('Chỉ có thể cập nhật số tiền của học phí chưa thanh toán')
              }

              let paymentIntent =
                paymentUpdate.amount !== undefined || statusChangedToPaid || statusChangedToUnpaid
                  ? await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPayment.paymentId)
                  : null

              if (statusChangedToUnpaid) {
                if (!paymentIntent) {
                  throw new NotFoundException(
                    `Không tìm thấy payment intent của học phí với ID ${tuitionPayment.paymentId}`,
                  )
                }

                await this.manualReconciliation.releaseBankTransferTransactions(repos, paymentIntent.paymentIntentId)
                paymentIntent = await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
                  status: PaymentIntentStatus.PENDING,
                })
              }

              if (paymentUpdate.status) {
                data.status = paymentUpdate.status
              }

              if (paymentUpdate.amount !== undefined) {
                data.amount = paymentUpdate.amount
              }

              if (paymentUpdate.month !== undefined) data.month = paymentUpdate.month
              if (paymentUpdate.year !== undefined) data.year = paymentUpdate.year

              // Handle paidAt - use provided value or set to now when changing to PAID
              if (statusChangedToUnpaid) {
                data.paidAt = null
              } else if (paymentUpdate.paidAt !== undefined) {
                data.paidAt = this.getDateWithoutTime(paymentUpdate.paidAt)
              } else if (paymentUpdate.status === TuitionPaymentStatus.PAID && !tuitionPayment.paidAt) {
                data.paidAt = this.getDateWithoutTime()
              }
              /**
               * =========================
               * Update payment
               * =========================
               */
              const updatedPayment = await tuitionPaymentRepository.update(paymentUpdate.paymentId, data)

              if (updatedPayment) {
                if (paymentUpdate.amount !== undefined) {
                  if (paymentIntent && isAmountChanged) {
                    const pendingAttempts = await repos.paymentAttemptRepository.findAll({
                      paymentIntentId: paymentIntent.paymentIntentId,
                      status: PaymentAttemptStatus.PENDING,
                    })
                    const expiresAt = new Date(Date.now() - EXPIRED_ATTEMPT_OFFSET_MS)
                    for (const pendingAttempt of pendingAttempts) {
                      await repos.paymentAttemptRepository.update(pendingAttempt.paymentAttemptId, {
                        status: PaymentAttemptStatus.EXPIRED,
                        expiresAt,
                      })
                    }
                  }

                  paymentIntent = paymentIntent
                    ? await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
                        amount: updatedPayment.amount!,
                      })
                    : await CreatePaymentIntentForCreatedTuitionPayment.execute(repos, updatedPayment)
                }

                if (statusChangedToPaid) {
                  if (paymentIntent && paymentIntent.status !== PaymentIntentStatus.PAID) {
                    paymentIntent = await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
                      status: PaymentIntentStatus.PAID,
                    })
                  }
                }

                results.updated.push(updatedPayment)
                if (statusChangedToPaid) {
                  results.parentNotifyPaymentIds.push(updatedPayment.paymentId)
                }
              }
            } catch (error) {
              results.failed.push({
                paymentId: paymentUpdate.paymentId,
                reason: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }

          /**
           * =========================
           * Audit log SUCCESS
           * =========================
           */
          if (adminId) {
            await adminAuditLogRepository.create({
              adminId,
              actionKey: ACTION_KEYS.TUITION_PAYMENT.UPDATE,
              status: AuditStatus.SUCCESS,
              resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
              afterData: {
                updatedCount: results.updated.length,
                failedCount: results.failed.length,
                updatedPaymentIds: results.updated.map((p) => p.paymentId),
                failedDetails: results.failed,
              },
              beforeData: {
                requestedCount: dto.payments.length,
              },
            })
          }

          // Gửi thông báo cho học sinh
          if (results.updated.length > 0) {
            const { studentRepository } = repos
            const notificationDataList: {
              userId: number
              title: string
              message: string
              type: NotificationType
              level: NotificationLevel
              data: any
            }[] = []

            for (const payment of results.updated) {
              const student = await studentRepository.findById(payment.studentId)
              if (student) {
                const statusLabel = TuitionPaymentStatusLabels[payment.status] || payment.status
                const notificationLevel =
                  payment.status === TuitionPaymentStatus.PAID ? NotificationLevel.SUCCESS : NotificationLevel.INFO
                notificationDataList.push({
                  userId: student.userId,
                  title: 'Cập nhật học phí',
                  message: `Học phí tháng ${payment.month}/${payment.year} đã được cập nhật - Số tiền: ${payment.amount?.toLocaleString('vi-VN')}đ - Trạng thái: ${statusLabel}`,
                  type: NotificationType.TUITION,
                  level: notificationLevel,
                  data: {
                    paymentId: payment.paymentId,
                    amount: payment.amount,
                    month: payment.month,
                    year: payment.year,
                    status: payment.status,
                    shouldShowReminderModal: true,
                  },
                })
              }
            }

            if (notificationDataList.length > 0) {
              this.createAndNotifyMany.execute(notificationDataList).catch(() => {
                /* ignore notification error */
              })
            }
          }

          return {
            responses: results.updated.map((p) => TuitionPaymentResponseDto.fromEntity(p)),
            parentNotifyPaymentIds: results.parentNotifyPaymentIds,
          }
        } catch (error) {
          /**
           * =========================
           * Audit log FAIL
           * =========================
           */
          if (adminId) {
            await adminAuditLogRepository.create({
              adminId,
              actionKey: ACTION_KEYS.TUITION_PAYMENT.UPDATE,
              status: AuditStatus.FAIL,
              resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            })
          }
          throw error
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    // Chỉ gửi Zalo cho phụ huynh khi học phí được cập nhật sang trạng thái PAID và sau khi transaction đã commit
    if (result.parentNotifyPaymentIds.length > 0) {
      await this.sendBulkTuitionPaymentToParentUseCase.execute({
        paymentIds: result.parentNotifyPaymentIds,
      })
    }

    return BaseResponseDto.success('Cập nhật học phí hàng loạt thành công', result.responses)
  }
}
