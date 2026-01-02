// src/application/use-cases/log/get-audit-logs-by-resource.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IAdminAuditLogRepository } from '../../../domain/repositories/admin-audit-log.repository'
import { LogResponseDto } from '../../dtos/log/log.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAuditLogsByResourceUseCase {
    constructor(
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
    ) { }

    async execute(resourceType: string, resourceId?: string): Promise<BaseResponseDto<LogResponseDto[]>> {
        let logs = await this.auditLogRepository.findByResourceType(resourceType)

        if (resourceId) {
            logs = logs.filter((log) => log.resourceId === resourceId)
        }

        const data = logs.map((log) => ({
            logId: log.logId,
            actionKey: log.actionKey,
            status: log.status,
            errorMessage: log.errorMessage,
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            beforeData: log.beforeData,
            afterData: log.afterData,
            createdAt: log.createdAt,
        }))

        return {
            success: true,
            message: 'Lấy danh sách audit logs theo resource thành công',
            data,
        }
    }
}
