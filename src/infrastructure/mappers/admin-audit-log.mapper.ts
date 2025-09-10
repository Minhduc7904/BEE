import { AdminAuditLog } from '../../domain/entities/log/admin-audit-log.entity';
import { AdminMapper } from './admin.mapper';

export class AdminAuditLogMapper {
    static toDomainAdminAuditLog(prismaLog: any): AdminAuditLog | null {
        if (!prismaLog) return null;

        return new AdminAuditLog(
            prismaLog.logId,
            prismaLog.adminId,
            prismaLog.actionKey,
            prismaLog.status,
            prismaLog.resourceType,
            prismaLog.errorMessage ?? undefined,
            prismaLog.resourceId ?? undefined,
            prismaLog.beforeData ?? undefined,
            prismaLog.afterData ?? undefined,
            prismaLog.createdAt,
            AdminMapper.toDomainAdmin(prismaLog.admin)
        );
    }
    static toDomainAdminAuditLogs(prismaLogs: any[]): AdminAuditLog[] {
        return prismaLogs.map(log => this.toDomainAdminAuditLog(log)).filter(Boolean) as AdminAuditLog[];
    }
}