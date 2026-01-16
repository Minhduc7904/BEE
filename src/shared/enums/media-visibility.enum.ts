// src/shared/enums/media-visibility.enum.ts

/**
 * Media Visibility Enum
 * Đồng bộ 100% với Prisma schema enum MediaVisibility
 */
export enum MediaVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
}

/**
 * Media Visibility Labels
 */
export const MediaVisibilityLabels: Record<MediaVisibility, string> = {
  [MediaVisibility.PUBLIC]: 'Công khai',
  [MediaVisibility.PRIVATE]: 'Riêng tư',
  [MediaVisibility.PROTECTED]: 'Bảo vệ',
}

/**
 * Media Visibility Descriptions
 */
export const MediaVisibilityDescriptions: Record<MediaVisibility, string> = {
  [MediaVisibility.PUBLIC]: 'Ai cũng có thể xem được',
  [MediaVisibility.PRIVATE]: 'Chỉ chủ sở hữu hoặc quản trị viên mới xem được',
  [MediaVisibility.PROTECTED]: 'Cần đăng nhập hoặc có quyền truy cập',
}

/**
 * Media Visibility Colors
 */
export const MediaVisibilityColors: Record<MediaVisibility, string> = {
  [MediaVisibility.PUBLIC]: 'green',
  [MediaVisibility.PRIVATE]: 'gray',
  [MediaVisibility.PROTECTED]: 'orange',
}

/**
 * Media Visibility Icons
 */
export const MediaVisibilityIcons: Record<MediaVisibility, string> = {
  [MediaVisibility.PUBLIC]: '🌍',
  [MediaVisibility.PRIVATE]: '🔒',
  [MediaVisibility.PROTECTED]: '🛡️',
}
