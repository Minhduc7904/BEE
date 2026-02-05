// src/shared/constants/media-field-name.constants.ts

/**
 * Media field names for Question
 */
export const QUESTION_MEDIA_FIELDS = {
  CONTENT: 'CONTENT',
  SOLUTION: 'SOLUTION',
} as const

/**
 * Content processing field names for Question
 * Used for identifying fields when processing presigned URLs
 */
export const QUESTION_CONTENT_FIELDS = {
  CONTENT: 'CONTENT',
  SOLUTION: 'SOLUTION',
  STATEMENT_PREFIX: 'STATEMENT_',
} as const

/**
 * Media field names for Statement
 */
export const STATEMENT_MEDIA_FIELDS = {
  CONTENT: 'CONTENT',
} as const

/**
 * Content processing field names for Statement
 * Used for identifying fields when processing presigned URLs
 */
export const STATEMENT_CONTENT_FIELDS = {
  CONTENT: 'CONTENT',
} as const

/**
 * Media field names for Exam
 */
export const EXAM_MEDIA_FIELDS = {
  DESCRIPTION: 'DESCRIPTION',
  EXAM_FILE: 'EXAM_FILE',
  SOLUTION_FILE: 'SOLUTION_FILE',
  EXAM_IMAGE: 'EXAM_IMAGE',
  SOLUTION_VIDEO: 'SOLUTION_VIDEO',
  EXAM_DOCUMENT: 'EXAM_DOCUMENT',
} as const

/**
 * Content processing field names for Exam
 * Used for identifying fields when processing presigned URLs
 */
export const EXAM_CONTENT_FIELDS = {
  DESCRIPTION: 'description',
} as const

/**
 * Media field names for TempExam
 */
export const TEMP_EXAM_MEDIA_FIELDS = {
  TEMP_EXAM_FILE: 'TEMP_EXAM_FILE',
  TEMP_SOLUTION_FILE: 'TEMP_SOLUTION_FILE',
  TEMP_EXAM_IMAGE: 'TEMP_EXAM_IMAGE',
  TEMP_SOLUTION_VIDEO: 'TEMP_SOLUTION_VIDEO',
  TEMP_EXAM_DOCUMENT: 'TEMP_EXAM_DOCUMENT',
} as const

/**
 * Mapping from TempExam field names to Exam field names
 */
export const TEMP_EXAM_TO_EXAM_FIELD_MAP: Record<string, string> = {
  [TEMP_EXAM_MEDIA_FIELDS.TEMP_EXAM_FILE]: EXAM_MEDIA_FIELDS.EXAM_FILE,
  [TEMP_EXAM_MEDIA_FIELDS.TEMP_SOLUTION_FILE]: EXAM_MEDIA_FIELDS.SOLUTION_FILE,
  [TEMP_EXAM_MEDIA_FIELDS.TEMP_EXAM_IMAGE]: EXAM_MEDIA_FIELDS.EXAM_IMAGE,
  [TEMP_EXAM_MEDIA_FIELDS.TEMP_SOLUTION_VIDEO]: EXAM_MEDIA_FIELDS.SOLUTION_VIDEO,
  [TEMP_EXAM_MEDIA_FIELDS.TEMP_EXAM_DOCUMENT]: EXAM_MEDIA_FIELDS.EXAM_DOCUMENT,
}
