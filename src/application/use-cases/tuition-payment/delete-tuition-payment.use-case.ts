import { Inject, Injectable } from "@nestjs/common";
import { BaseResponseDto } from "src/application/dtos/common/base-response.dto";
import type { IUnitOfWork } from "src/domain/repositories/unit-of-work.repository";
import { ACTION_KEYS } from "src/shared/constants/action-key.constants";
import { RESOURCE_TYPES } from "src/shared/constants/resource-type.constants";
import { AuditStatus } from "src/shared/enums/audit-status.enum";
import { NotFoundException,  } from "src/shared/exceptions/custom-exceptions";
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { NotificationType, NotificationLevel } from 'src/shared/enums'

@Injectable()
export class DeleteTuitionPaymentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
    ) {}

    async execute(
        paymentId: number,
        adminId?: number,
    ): Promise<BaseResponseDto<{ deleted: boolean }>> {
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
                this.createAndNotifyOne.execute({
                    userId: student.userId,
                    title: 'Xóa học phí',
                    message: `Học phí tháng ${existing.month}/${existing.year} đã bị xóa`,
                    type: NotificationType.TUITION,
                    level: NotificationLevel.WARNING,
                    data: { month: existing.month, year: existing.year },
                }).catch(() => { /* ignore notification error */ })
            }

            return { deleted }
        })

        return BaseResponseDto.success('Xóa học phí thành công', result)
    }
}