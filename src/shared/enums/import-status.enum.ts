

// src/shared/enums/import-status.enum.ts
/**
 * Import Status Enum
 * Đồng bộ với Prisma schema enum ImportStatus
 */
export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PARSED = 'PARSED',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

/**
 * Import Status Labels
 */
export const ImportStatusLabels: Record<ImportStatus, string> = {
  [ImportStatus.PENDING]: 'Đang chờ xử lý',
  [ImportStatus.PROCESSING]: 'Đang xử lý PDF',
  [ImportStatus.PARSED]: 'Đã parse xong',
  [ImportStatus.REVIEWING]: 'Đang review',
  [ImportStatus.APPROVED]: 'Đã duyệt',
  [ImportStatus.COMPLETED]: 'Hoàn thành',
  [ImportStatus.REJECTED]: 'Bị từ chối',
  [ImportStatus.FAILED]: 'Thất bại',
}

/**
 * Import Status Descriptions
 */
export const ImportStatusDescriptions: Record<ImportStatus, string> = {
  [ImportStatus.PENDING]: 'Phiên import đang chờ được xử lý',
  [ImportStatus.PROCESSING]: 'Đang parse nội dung từ PDF',
  [ImportStatus.PARSED]: 'Đã parse xong, chờ review',
  [ImportStatus.REVIEWING]: 'Admin đang review và chỉnh sửa',
  [ImportStatus.APPROVED]: 'Đã được duyệt, sẵn sàng migrate',
  [ImportStatus.COMPLETED]: 'Đã migrate sang bảng chính thành công',
  [ImportStatus.REJECTED]: 'Bị từ chối, không migrate',
  [ImportStatus.FAILED]: 'Xử lý thất bại, có lỗi xảy ra',
}
    