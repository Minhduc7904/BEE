// src/shared/constants/entity-type.constants.ts

/**
 * Entity types for media usage tracking
 * Used to identify which entity type a media file is attached to
 */
export const ENTITY_TYPES = {
  USER: 'USER',
  STUDENT: 'STUDENT',
  COURSE: 'COURSE',
  LESSON: 'LESSON',
  EXAM: 'EXAM',
  EXAM_IMPORT_SESSION: 'EXAM_IMPORT_SESSION',
  TEMP_EXAM: 'TEMP_EXAM',
  TEMP_SECTION: 'TEMP_SECTION',
  TEMP_QUESTION: 'TEMP_QUESTION',
  CHAPTER: 'CHAPTER',
  MEDIA: 'MEDIA',
  AVATAR: 'AVATAR',
} as const

export enum EntityType {
  USER = 'USER',
  STUDENT = 'STUDENT',
  COURSE = 'COURSE',
  LESSON = 'LESSON',
  EXAM = 'EXAM',
  EXAM_IMPORT_SESSION = 'EXAM_IMPORT_SESSION',
  TEMP_EXAM = 'TEMP_EXAM',
  TEMP_SECTION = 'TEMP_SECTION',
  TEMP_QUESTION = 'TEMP_QUESTION',
  CHAPTER = 'CHAPTER',
  MEDIA = 'MEDIA',
  AVATAR = 'AVATAR',
}
