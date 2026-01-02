// src/application/use-cases/log/get-audit-logs-by-admin.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IAdminAuditLogRepository } from '../../../domain/repositories/admin-audit-log.repository'
import { LogResponseDto } from '../../dtos/log/log.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAuditLogsByAdminUseCase {
  constructor(
    @Inject('IAdminAuditLogRepository')
    private readonly auditLogRepository: IAdminAuditLogRepository,
  ) {}

  async execute(adminId: number): Promise<BaseResponseDto<LogResponseDto[]>> {
    const logs = await this.auditLogRepository.findByAdminId(adminId)

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
      message: `Lấy danh sách audit logs của admin ${adminId} thành công`,
      data,
    }
  }
}
