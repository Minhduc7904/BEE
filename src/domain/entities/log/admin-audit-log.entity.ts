// src/domain/entities/log/admin-audit-log.entity.ts
import { AuditStatus } from '../../../shared/enums/audit-status.enum';
import { Admin } from '../user/admin.entity';

export class AdminAuditLog {
    logId: number;
    adminId: number;
    actionKey: string;
    status: AuditStatus;
    errorMessage?: string;
    resourceType: string;
    resourceId?: string;
    beforeData?: any;
    afterData?: any;
    createdAt: Date;
    admin?: Admin;

    constructor(
        logId: number,
        adminId: number,
        actionKey: string,
        status: AuditStatus,
        resourceType: string,
        errorMessage?: string,
        resourceId?: string,
        beforeData?: any,
        afterData?: any,
        createdAt?: Date,
        admin?: Admin
    ) {
        this.logId = logId;
        this.adminId = adminId;
        this.actionKey = actionKey;
        this.status = status;
        this.errorMessage = errorMessage;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.beforeData = beforeData;
        this.afterData = afterData;
        this.createdAt = createdAt || new Date();
        this.admin = admin;
    }


}
