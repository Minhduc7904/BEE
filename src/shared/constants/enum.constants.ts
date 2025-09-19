// src/shared/constants/enum.constants.ts
import { StorageProvider, StorageProviderLabels } from '../enums/storage-provider.enum'
import { AuditStatus, AuditStatusLabels } from '../enums/audit-status.enum'
import { CourseVisibility, CourseVisibilityLabels } from '../enums/course-visibility.enum'
import { Difficulty, DifficultyLabels } from '../enums/difficulty.enum'
import { QuestionType, QuestionTypeLabels } from '../enums/question-type.enum'
import { LearningItemType, LearningItemTypeLabels } from '../enums/learning-item-type.enum'

/**
 * Tất cả enum values và labels trong một object
 */
export const ENUM_VALUES = {
  STORAGE_PROVIDER: {
    values: Object.values(StorageProvider),
    labels: StorageProviderLabels,
  },
  AUDIT_STATUS: {
    values: Object.values(AuditStatus),
    labels: AuditStatusLabels,
  },
  COURSE_VISIBILITY: {
    values: Object.values(CourseVisibility),
    labels: CourseVisibilityLabels,
  },
  DIFFICULTY: {
    values: Object.values(Difficulty),
    labels: DifficultyLabels,
  },
  QUESTION_TYPE: {
    values: Object.values(QuestionType),
    labels: QuestionTypeLabels,
  },
  LEARNING_ITEM_TYPE: {
    values: Object.values(LearningItemType),
    labels: LearningItemTypeLabels,
  },
} as const

/**
 * Type để lấy all enum keys
 */
export type EnumKey = keyof typeof ENUM_VALUES

/**
 * Helper function để lấy enum values
 */
export const getEnumValues = (enumKey: EnumKey) => {
  return ENUM_VALUES[enumKey].values
}

/**
 * Helper function để lấy enum labels
 */
export const getEnumLabels = (enumKey: EnumKey) => {
  return ENUM_VALUES[enumKey].labels
}
