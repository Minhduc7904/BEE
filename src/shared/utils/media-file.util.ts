import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

export function normalizeExtension(extension?: string): string {
  if (!extension) {
    return ''
  }

  const cleaned = extension.replace('.', '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return cleaned ? `.${cleaned}` : ''
}

export function sanitizeFilename(
  filename: string,
  options?: {
    fallbackName?: string
    overrideExtension?: string
  },
): string {
  const { name, ext } = path.parse(filename)
  const normalizedExtension = normalizeExtension(options?.overrideExtension ?? ext)

  const normalizedName = name
    .toLowerCase()
    .replace(/\u0111/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  const safeName = normalizedName || options?.fallbackName || 'file'
  return `${safeName}${normalizedExtension}`
}

export function generateObjectKey(
  prefix: string,
  originalFilename: string,
  options?: {
    now?: Date
    uniqueId?: string
  },
): string {
  const now = options?.now ?? new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const fileExt = path.extname(originalFilename) || ''
  const uniqueId = options?.uniqueId ?? uuidv4()
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '')

  return `${normalizedPrefix}/${year}/${month}/${uniqueId}${fileExt}`
}

export function buildPublicObjectPath(bucketName: string, objectKey: string): string {
  const normalizedBucket = bucketName.replace(/^\/+|\/+$/g, '')
  const normalizedObjectKey = objectKey.replace(/^\/+/, '')
  const bucketPrefix = `${normalizedBucket}/`
  const objectPath = normalizedObjectKey.startsWith(bucketPrefix)
    ? normalizedObjectKey.slice(bucketPrefix.length)
    : normalizedObjectKey
  return `/${normalizedBucket}/${objectPath}`
}

export function normalizeStoredPublicPath(
  publicUrl: string,
  bucketName: string,
  objectKey: string,
): string {
  const fallbackPath = buildPublicObjectPath(bucketName, objectKey)
  const trimmed = publicUrl?.trim()

  if (!trimmed) {
    return fallbackPath
  }

  try {
    const parsed = new URL(trimmed)
    return parsed.pathname || fallbackPath
  } catch {
    if (trimmed.startsWith('/')) {
      return trimmed
    }
    return fallbackPath
  }
}

export function resolvePublicUrlFromDb(publicUrl?: string | null): string | undefined {
  if (!publicUrl) {
    return undefined
  }

  const trimmed = publicUrl.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    new URL(trimmed)
    return trimmed
  } catch {
    const base = process.env.MINIO_PUBLIC_URL?.trim()
    if (!base) {
      return trimmed
    }

    const normalizedBase = base.replace(/\/+$/, '')
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${normalizedBase}${normalizedPath}`
  }
}
