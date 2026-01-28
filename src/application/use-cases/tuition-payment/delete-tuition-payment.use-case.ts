import { Inject, Injectable } from "@nestjs/common";
import { BaseResponseDto } from "src/application/dtos/common/base-response.dto";
import type { IUnitOfWork } from "src/domain/repositories/unit-of-work.repository";
import { ACTION_KEYS } from "src/shared/constants/action-key.constants";
import { RESOURCE_TYPES } from "src/shared/constants/resource-type.constants";
import { AuditStatus } from "src/shared/enums/audit-status.enum";
import { NotFoundException,  } from "src/shared/exceptions/custom-exceptions";
@Injectable()
export class DeleteTuitionPaymentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
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
            return { deleted }
        })

        return BaseResponseDto.success('Xóa học phí thành công', result)
    }
}