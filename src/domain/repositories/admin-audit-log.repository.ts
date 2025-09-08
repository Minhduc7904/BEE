// src/domain/repositories/admin-audit-log.repository.ts

import { AdminAuditLog } from '../entities/log/admin-audit-log.entity';
import { CreateLogDto } from '../../application/dtos/log/log.dto';
import { AuditStatus } from '../../shared/enums/audit-status.enum';

export interface IAdminAuditLogRepository {
    create(data: CreateLogDto): Promise<AdminAuditLog>;
    updateStatus(id: number, status: AuditStatus): Promise<AdminAuditLog>;
    findById(id: number): Promise<AdminAuditLog | null>;
    findByAdminId(adminId: number): Promise<AdminAuditLog[]>;
    findByActionKey(actionKey: string): Promise<AdminAuditLog[]>;
    findByResourceType(resourceType: string): Promise<AdminAuditLog[]>;
    findByResourceId(resourceId: string): Promise<AdminAuditLog[]>;
    findAll(): Promise<AdminAuditLog[]>;
}