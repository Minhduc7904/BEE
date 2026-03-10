import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentResponseDto } from 'src/application/dtos'
import { UpdateArrayBulkTuitionPaymentDto } from 'src/application/dtos/tuition-payment/update-array-bulk-tuition-payment.dto'
import type { IUnitOfWork } from 'src/domain/repositories'
import {
    NotFoundException,
    InvalidStateException,
    UnauthorizedException,
} from 'src/shared/exceptions/custom-exceptions'
import { AuditStatus, TuitionPaymentStatus, NotificationType, NotificationLevel, TuitionPaymentStatusLabels } from 'src/shared/enums'
import { RESOURCE_TYPES, ACTION_KEYS } from 'src/shared/constants'
import { UpdateTuitionPaymentData } from 'src/domain/interface'
import { TuitionPayment } from 'src/domain/entities/tuition-payment/tuition-payment.entity'
import { CreateAndNotifyManyUseCase } from '../notification/create-and-notify-many.use-case'

@Injectable()
export class UpdateArrayBulkTuitionPaymentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly createAndNotifyMany: CreateAndNotifyManyUseCase,
    ) { }

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

        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const { tuitionPaymentRepository, adminAuditLogRepository } = repos

            try {
                const results: {
                    updated: TuitionPayment[]
                    failed: any[]
                } = {
                    updated: [],
                    failed: [],
                }

                /**
                 * =========================
                 * Process each payment
                 * =========================
                 */
                for (const paymentUpdate of dto.payments) {
                    try {
                        const tuitionPayment = await tuitionPaymentRepository.findById(
                            paymentUpdate.paymentId,
                        )

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
                        const data: UpdateTuitionPaymentData = {
                            notes: paymentUpdate.notes,
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
                        if (paymentUpdate.paidAt !== undefined) {
                            data.paidAt = this.getDateWithoutTime(paymentUpdate.paidAt)
                        } else if (
                            paymentUpdate.status === TuitionPaymentStatus.PAID &&
                            !tuitionPayment.paidAt
                        ) {
                            data.paidAt = this.getDateWithoutTime()
                        }
                        /**
                         * =========================
                         * Update payment
                         * =========================
                         */
                        const updatedPayment = await tuitionPaymentRepository.update(
                            paymentUpdate.paymentId,
                            data,
                        )

                        if (updatedPayment) {
                            results.updated.push(updatedPayment)
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
                    const notificationDataList: { userId: number; title: string; message: string; type: NotificationType; level: NotificationLevel; data: any }[] = []

                    for (const payment of results.updated) {
                        const student = await studentRepository.findById(payment.studentId)
                        if (student) {
                            const statusLabel = TuitionPaymentStatusLabels[payment.status] || payment.status
                            notificationDataList.push({
                                userId: student.userId,
                                title: 'Cập nhật học phí',
                                message: `Học phí tháng ${payment.month}/${payment.year} đã được cập nhật - Số tiền: ${payment.amount?.toLocaleString('vi-VN')}đ - Trạng thái: ${statusLabel}`,
                                type: NotificationType.TUITION,
                                level: NotificationLevel.INFO,
                                data: { paymentId: payment.paymentId, amount: payment.amount, month: payment.month, year: payment.year, status: payment.status },
                            })
                        }
                    }

                    if (notificationDataList.length > 0) {
                        this.createAndNotifyMany.execute(notificationDataList).catch(() => { /* ignore notification error */ })
                    }
                }

                return results.updated.map((p) => TuitionPaymentResponseDto.fromEntity(p))
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
        })

        return BaseResponseDto.success('Cập nhật học phí hàng loạt thành công', result)
    }
}
