// src/shared/enums/media-status.enum.ts

/**
 * Media Status Enum
 * Đồng bộ 100% với Prisma schema enum MediaStatus
 */
export enum MediaStatus {
  UPLOADING = 'UPLOADING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

/**
 * Media Status Labels
 */
export const MediaStatusLabels: Record<MediaStatus, string> = {
  [MediaStatus.UPLOADING]: 'Đang tải lên',
  [MediaStatus.READY]: 'Sẵn sàng',
  [MediaStatus.FAILED]: 'Thất bại',
  [MediaStatus.DELETED]: 'Đã xoá',
}

/**
 * Media Status Descriptions
 */
export const MediaStatusDescriptions: Record<MediaStatus, string> = {
  [MediaStatus.UPLOADING]: 'Tệp đang trong quá trình tải lên hệ thống',
  [MediaStatus.READY]: 'Tệp đã sẵn sàng để sử dụng',
  [MediaStatus.FAILED]: 'Tải tệp thất bại',
  [MediaStatus.DELETED]: 'Tệp đã bị xoá khỏi hệ thống',
}

/**
 * Media Status Colors
 */
export const MediaStatusColors: Record<MediaStatus, string> = {
  [MediaStatus.UPLOADING]: 'orange',
  [MediaStatus.READY]: 'green',
  [MediaStatus.FAILED]: 'red',
  [MediaStatus.DELETED]: 'gray',
}

/**
 * Media Status Icons
 */
export const MediaStatusIcons: Record<MediaStatus, string> = {
  [MediaStatus.UPLOADING]: '⬆️',
  [MediaStatus.READY]: '✅',
  [MediaStatus.FAILED]: '❌',
  [MediaStatus.DELETED]: '🗑️',
}
