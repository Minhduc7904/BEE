// src/shared/enums/audit-status.enum.ts

/**
 * Audit Status Enum
 * Đồng bộ với Prisma schema enum AuditStatus
 */
export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

/**
 * Audit Status Labels
 */
export const AuditStatusLabels: Record<AuditStatus, string> = {
  [AuditStatus.SUCCESS]: 'Thành công',
  [AuditStatus.FAIL]: 'Thất bại',
};

/**
 * Audit Status Colors for UI
 */
export const AuditStatusColors: Record<AuditStatus, string> = {
  [AuditStatus.SUCCESS]: 'green',
  [AuditStatus.FAIL]: 'red',
};
