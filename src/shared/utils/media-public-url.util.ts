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

  const normalizedPath = normalizeMinioPath(rawUrl, baseUrl)
  return `${baseUrl}${normalizedPath}`
}

function normalizeMinioPath(rawUrl: string, baseUrl: string): string {
  const rawPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
  let basePath = ''

  try {
    basePath = new URL(baseUrl).pathname.replace(/\/+$/, '')
  } catch {
    basePath = ''
  }

  if (basePath && rawPath === basePath) {
    return '/'
  }

  if (basePath && rawPath.startsWith(`${basePath}/`)) {
    return rawPath.slice(basePath.length)
  }

  if (!basePath && rawPath.startsWith('/minio/')) {
    return rawPath.slice('/minio'.length)
  }

  return rawPath
}
