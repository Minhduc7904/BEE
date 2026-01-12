// src/shared/enums/visibility.enum.ts

/**
 *  Visibility Enum
 * Đồng bộ với Prisma schema enum Visibility
 */
export enum Visibility {
  DRAFT = 'DRAFT',
  PRIVATE = 'PRIVATE',
  PUBLISHED = 'PUBLISHED',
}

/**
 *  Visibility Labels
 */
export const VisibilityLabels: Record<Visibility, string> = {
  [Visibility.DRAFT]: 'Bản nháp',
  [Visibility.PRIVATE]: 'Riêng tư',
  [Visibility.PUBLISHED]: 'Công khai',
}

/**
 *  Visibility Descriptions
 */
export const VisibilityDescriptions: Record<Visibility, string> = {
  [Visibility.DRAFT]: 'Khóa học đang trong quá trình phát triển',
  [Visibility.PRIVATE]: 'Chỉ admin và giáo viên có thể xem',
  [Visibility.PUBLISHED]: 'Tất cả học sinh có thể đăng ký',
}
