// src/shared/constants/enum.constants.ts
import { StorageProvider, StorageProviderLabels } from '../enums/storage-provider.enum'
import { AuditStatus, AuditStatusLabels } from '../enums/audit-status.enum'
import { CourseVisibility, CourseVisibilityLabels } from '../enums/course-visibility.enum'
import { Difficulty, DifficultyLabels } from '../enums/difficulty.enum'
import { QuestionType, QuestionTypeLabels } from '../enums/question-type.enum'
import { LearningItemType, LearningItemTypeLabels } from '../enums/learning-item-type.enum'
import { Gender, GenderLabels } from '../enums/gender.enum'
import { Visibility, VisibilityLabels } from '../enums/visibility.enum'
import { PointType, PointTypeLabels } from '../enums/point-type.enum'
import { PaymentType, PaymentTypeLabels } from '../enums/payment-type.enum'
import { CourseEnrollmentStatus, CourseEnrollmentStatusLabels } from '../enums/course-enrollment-status.enum'
import { AttendanceStatus, AttendanceStatusLabels } from '../enums/attendance-status.enum'
import { MediaType, MediaTypeLabels } from '../enums/media-type.enum'
import { MediaStatus, MediaStatusLabels } from '../enums/media-status.enum'
import { MediaVisibility, MediaVisibilityLabels } from '../enums/media-visibility.enum'
import { TuitionPaymentStatus, TuitionPaymentStatusLabels } from '../enums/tuition-payment-status.enum'

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
  GENDER: {
    values: Object.values(Gender),
    labels: GenderLabels,
  },
  VISIBILITY: {
    values: Object.values(Visibility),
    labels: VisibilityLabels,
  },
  POINT_TYPE: {
    values: Object.values(PointType),
    labels: PointTypeLabels,
  },
  PAYMENT_TYPE: {
    values: Object.values(PaymentType),
    labels: PaymentTypeLabels,
  },
  COURSE_ENROLLMENT_STATUS: {
    values: Object.values(CourseEnrollmentStatus),
    labels: CourseEnrollmentStatusLabels,
  },
  ATTENDANCE_STATUS: {
    values: Object.values(AttendanceStatus),
    labels: AttendanceStatusLabels,
  },
  MEDIA_TYPE: {
    values: Object.values(MediaType),
    labels: MediaTypeLabels,
  },
  MEDIA_STATUS: {
    values: Object.values(MediaStatus),
    labels: MediaStatusLabels,
  },
  MEDIA_VISIBILITY: {
    values: Object.values(MediaVisibility),
    labels: MediaVisibilityLabels,
  },
  TUITION_PAYMENT_STATUS: {
    values: Object.values(TuitionPaymentStatus),
    labels: TuitionPaymentStatusLabels,
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
