// src/shared/enums/point-type.enum.ts

/**
 * Point Type Enum
 * Đồng bộ với Prisma schema enum PointType
 */
export enum PointType {
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

/**
 * Point Type Labels
 */
export const PointTypeLabels: Record<PointType, string> = {
  [PointType.BONUS]: 'Thưởng điểm',
  [PointType.PENALTY]: 'Trừ điểm',
}

/**
 * Point Type Descriptions
 */
export const PointTypeDescriptions: Record<PointType, string> = {
  [PointType.BONUS]: 'Học sinh được cộng điểm',
  [PointType.PENALTY]: 'Học sinh bị trừ điểm',
}

/**
 * Point Type Colors
 */
export const PointTypeColors: Record<PointType, string> = {
  [PointType.BONUS]: 'green',
  [PointType.PENALTY]: 'red',
}
