export function toMinioPublicUrl(publicUrl?: string | null): string {
  if (!publicUrl) {
    return ''
  }

  const rawUrl = publicUrl.trim()
  if (!rawUrl) {
    return ''
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl
  }

  const baseUrl = (process.env.MINIO_PUBLIC_URL || '').trim().replace(/\/+$/, '')
  if (!baseUrl) {
    return rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
  }

  const normalizedPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
  return `${baseUrl}${normalizedPath}`
}
