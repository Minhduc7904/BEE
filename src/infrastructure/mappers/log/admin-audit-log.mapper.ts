import { AdminAuditLog } from '../../../domain/entities'
import { AdminMapper } from '..'

export class AdminAuditLogMapper {
  static toDomainAdminAuditLog(prismaLog: any): AdminAuditLog | null {
    if (!prismaLog) return null

    return new AdminAuditLog({
      logId: prismaLog.logId,
      adminId: prismaLog.adminId,
      actionKey: prismaLog.actionKey,
      status: prismaLog.status,
      resourceType: prismaLog.resourceType,
      createdAt: prismaLog.createdAt,
      errorMessage: prismaLog.errorMessage ?? undefined,
      resourceId: prismaLog.resourceId ?? undefined,
      beforeData: prismaLog.beforeData ?? undefined,
      afterData: prismaLog.afterData ?? undefined,
      admin: AdminMapper.toDomainAdmin(prismaLog.admin),
    })
  }
  static toDomainAdminAuditLogs(prismaLogs: any[]): AdminAuditLog[] {
    return prismaLogs.map((log) => this.toDomainAdminAuditLog(log)).filter(Boolean) as AdminAuditLog[]
  }
}
