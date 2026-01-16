// src/shared/enums/learning-item-type.enum.ts

/**
 * Learning Item Type Enum
 * Đồng bộ 100% với Prisma schema enum LearningItemType
 */
export enum LearningItemType {
  HOMEWORK = 'HOMEWORK',
  DOCUMENT = 'DOCUMENT',
  YOUTUBE = 'YOUTUBE',
  VIDEO = 'VIDEO',
}

/**
 * Learning Item Type Labels
 */
export const LearningItemTypeLabels: Record<LearningItemType, string> = {
  [LearningItemType.HOMEWORK]: 'Bài tập',
  [LearningItemType.DOCUMENT]: 'Tài liệu',
  [LearningItemType.YOUTUBE]: 'Video YouTube',
  [LearningItemType.VIDEO]: 'Video',
}

/**
 * Learning Item Type Descriptions
 */
export const LearningItemTypeDescriptions: Record<LearningItemType, string> = {
  [LearningItemType.HOMEWORK]: 'Bài tập về nhà dành cho học viên',
  [LearningItemType.DOCUMENT]: 'Tài liệu học tập (PDF, Word, Slide...)',
  [LearningItemType.YOUTUBE]: 'Video học tập từ YouTube',
  [LearningItemType.VIDEO]: 'Video học tập được tải lên hệ thống',
}

/**
 * Learning Item Type Colors
 */
export const LearningItemTypeColors: Record<LearningItemType, string> = {
  [LearningItemType.HOMEWORK]: 'orange',
  [LearningItemType.DOCUMENT]: 'blue',
  [LearningItemType.YOUTUBE]: 'red',
  [LearningItemType.VIDEO]: 'purple',
}

/**
 * Learning Item Type Icons
 */
export const LearningItemTypeIcons: Record<LearningItemType, string> = {
  [LearningItemType.HOMEWORK]: '📝',
  [LearningItemType.DOCUMENT]: '📄',
  [LearningItemType.YOUTUBE]: '▶️',
  [LearningItemType.VIDEO]: '🎥',
}
