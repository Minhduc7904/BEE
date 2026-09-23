const optional = (value?: string): string | undefined => value?.trim() || undefined

/**
 * Build the stable, non-expiring public content URL for a media usage.
 * Unlike a presigned MinIO URL, this URL never expires: access is gated
 * server-side by MediaUsage.visibility === PUBLIC on each request.
 */
export function buildMediaUsageContentUrl(usageId: number): string {
  const apiBaseUrl = (
    optional(process.env.API_BASE_URL) ||
    `${optional(process.env.APP_URL) || 'http://localhost:3001'}/api`
  ).replace(/\/+$/, '')

  return `${apiBaseUrl}/media/usage/${usageId}/content`
}
