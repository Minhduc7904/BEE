import { Inject, Injectable } from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';

@Injectable()
export class DeleteClassSessionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        sessionId: number,
        adminId?: number,
    ): Promise<BaseResponseDto<null>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const classSessionRepository = repos.classSessionRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Check if class session exists
            const classSession = await classSessionRepository.findById(sessionId);
            if (!classSession) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.CLASS_SESSION.DELETE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.CLASS_SESSION,
                        resourceId: sessionId.toString(),
                        errorMessage: `Buổi học với ID ${sessionId} không tồn tại`,
                    })
                }
                throw new NotFoundException(`Buổi học với ID ${sessionId} không tồn tại`);
            }

            await classSessionRepository.delete(sessionId);

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.CLASS_SESSION.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.CLASS_SESSION,
                    resourceId: sessionId.toString(),
                    beforeData: {
                        classId: classSession.classId,
                        sessionDate: classSession.sessionDate,
                        name: classSession.name,
                    },
                })
            }

            return null
        })

        return BaseResponseDto.success('Xóa buổi học thành công', result)
    }
}
