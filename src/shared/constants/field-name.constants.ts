// src/shared/constants/field-name.constants.ts

/**
 * Field names for media usage tracking
 * Used to identify which field of an entity a media file is attached to
 */
export const FIELD_NAMES = {

  // Document & Video
  DOCUMENT_FILE: 'DOCUMENT_FILE',
  VIDEO_FILE: 'VIDEO_FILE',

  // User
  AVATAR: 'avatar',
  
} as const

export type FieldName = typeof FIELD_NAMES[keyof typeof FIELD_NAMES]
