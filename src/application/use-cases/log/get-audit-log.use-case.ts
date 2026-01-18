// src/application/use-cases/log/get-audit-log.use-case.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IAdminAuditLogRepository } from '../../../domain/repositories/admin-audit-log.repository'
import { LogResponseDto } from '../../dtos/log/log.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAuditLogUseCase {
    constructor(
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<LogResponseDto>> {
        const log = await this.auditLogRepository.findById(id)

        if (!log) {
            throw new NotFoundException(`Audit log với ID ${id} không tồn tại`)
        }

        return {
            success: true,
            message: 'Lấy thông tin audit log thành công',
            data: {
                logId: log.logId,
                actionKey: log.actionKey,
                status: log.status,
                errorMessage: log.errorMessage,
                resourceType: log.resourceType,
                resourceId: log.resourceId,
                beforeData: log.beforeData,
                afterData: log.afterData,
                createdAt: log.createdAt,
                admin: log.admin ? {
                    adminId: log.admin.adminId,
                    userId: log.admin.userId,
                    username: log.admin.user?.username,
                    firstName: log.admin.user?.firstName,
                    lastName: log.admin.user?.lastName,
                    email: log.admin.user?.email,
                } : undefined,
            },
        }
    }
}
