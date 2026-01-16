// src/shared/enums/media-type.enum.ts

/**
 * Media Type Enum
 * Đồng bộ với Prisma schema enum MediaType
 */
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

/**
 * Media Type Labels
 */
export const MediaTypeLabels: Record<MediaType, string> = {
  [MediaType.IMAGE]: 'Hình ảnh',
  [MediaType.VIDEO]: 'Video',
  [MediaType.DOCUMENT]: 'Tài liệu',
  [MediaType.AUDIO]: 'Âm thanh',
  [MediaType.OTHER]: 'Khác',
}

/**
 * Media Type Descriptions
 */
export const MediaTypeDescriptions: Record<MediaType, string> = {
  [MediaType.IMAGE]: 'File hình ảnh (JPG, PNG, GIF, ...)',
  [MediaType.VIDEO]: 'File video (MP4, AVI, MKV, ...)',
  [MediaType.DOCUMENT]: 'File tài liệu (PDF, DOC, PPT, ...)',
  [MediaType.AUDIO]: 'File âm thanh (MP3, WAV, ...)',
  [MediaType.OTHER]: 'Loại file khác',
}

/**
 * Media Type Icons
 */
export const MediaTypeIcons: Record<MediaType, string> = {
  [MediaType.IMAGE]: '🖼️',
  [MediaType.VIDEO]: '🎥',
  [MediaType.DOCUMENT]: '📄',
  [MediaType.AUDIO]: '🎵',
  [MediaType.OTHER]: '📎',
}

/**
 * Media Type Colors
 */
export const MediaTypeColors: Record<MediaType, string> = {
  [MediaType.IMAGE]: 'purple',
  [MediaType.VIDEO]: 'red',
  [MediaType.DOCUMENT]: 'blue',
  [MediaType.AUDIO]: 'green',
  [MediaType.OTHER]: 'gray',
}
