// src/shared/enums/learning-item-type.enum.ts

/**
 * Learning Item Type Enum
 * Đồng bộ với Prisma schema enum LearningItemType
 */
export enum LearningItemType {
  HOMEWORK = 'HOMEWORK',
  DOCUMENT = 'DOCUMENT',
  YOUTUBE = 'YOUTUBE',
  EXERCISE = 'EXERCISE',
}

/**
 * Learning Item Type Labels
 */
export const LearningItemTypeLabels: Record<LearningItemType, string> = {
  [LearningItemType.HOMEWORK]: 'Bài tập về nhà',
  [LearningItemType.DOCUMENT]: 'Tài liệu',
  [LearningItemType.YOUTUBE]: 'Video YouTube',
  [LearningItemType.EXERCISE]: 'Bài tập',
};

/**
 * Learning Item Type Icons
 */
export const LearningItemTypeIcons: Record<LearningItemType, string> = {
  [LearningItemType.HOMEWORK]: '📚',
  [LearningItemType.DOCUMENT]: '📄',
  [LearningItemType.YOUTUBE]: '🎥',
  [LearningItemType.EXERCISE]: '✏️',
};
