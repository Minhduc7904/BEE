import { MediaType } from 'src/shared/enums'

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

export function detectMediaType(mimeType?: string | null): MediaType {
  if (!mimeType) {
    return MediaType.OTHER
  }

  const normalizedMimeType = mimeType.toLowerCase()

  if (normalizedMimeType.startsWith('image/')) {
    return MediaType.IMAGE
  }

  if (normalizedMimeType.startsWith('video/')) {
    return MediaType.VIDEO
  }

  if (normalizedMimeType.startsWith('audio/')) {
    return MediaType.AUDIO
  }

  if (DOCUMENT_MIME_TYPES.has(normalizedMimeType)) {
    return MediaType.DOCUMENT
  }

  return MediaType.OTHER
}
