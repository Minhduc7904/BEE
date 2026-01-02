// src/application/use-cases/log/get-all-audit-logs.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IAdminAuditLogRepository } from '../../../domain/repositories/admin-audit-log.repository'
import { LogResponseDto } from '../../dtos/log/log.dto'
import { AuditLogListQueryDto } from '../../dtos/log/audit-log-list-query.dto'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'

@Injectable()
export class GetAllAuditLogsUseCase {
    constructor(
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
    ) { }

    async execute(query: AuditLogListQueryDto): Promise<PaginationResponseDto<LogResponseDto>> {
        const { page = 1, limit = 10 } = query
        
        const { data: logs, total } = await this.auditLogRepository.findAllWithPagination(query)

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
            admin: log.admin ? {
                adminId: log.admin.adminId,
                userId: log.admin.userId,
                username: log.admin.user?.username,
                firstName: log.admin.user?.firstName,
                lastName: log.admin.user?.lastName,
                email: log.admin.user?.email,
                avatarUrl: log.admin.user?.avatar?.publicUrl,
            } : undefined,
        }))

        return PaginationResponseDto.success('Lấy danh sách audit logs thành công', data, page, limit, total)
    }
}
