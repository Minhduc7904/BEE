/**
 * Utility functions for extracting and processing media references in content
 */

/**
 * Extract media IDs from image markdown patterns
 * Pattern: ![media:123](...)
 * @param content - Content string to extract media IDs from
 * @returns Set of unique media IDs found in the content
 */
export function extractMediaIdsFromImages(content: string): Set<number> {
  const mediaIds = new Set<number>()
  if (!content) return mediaIds

  const pattern = /!\[media:(\d+)\]\([^)]*\)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    mediaIds.add(Number(match[1]))
  }

  return mediaIds
}

/**
 * Extract media IDs from ALT text patterns
 * Pattern: [media:123]
 * @param content - Content string to extract media IDs from
 * @returns Set of unique media IDs found in the content
 */
export function extractMediaIdsFromAlt(content: string): Set<number> {
  const mediaIds = new Set<number>()
  if (!content) return mediaIds

  const pattern = /\[media:(\d+)\]/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    mediaIds.add(Number(match[1]))
  }

  return mediaIds
}

/**
 * Normalize media markdown to standard format
 * ![media:123](ANYTHING) → ![media:123](media:123)
 * @param content - Content string to normalize
 * @returns Normalized content string
 */
export function normalizeMediaMarkdown(content: string): string {
  if (!content) return content

  const pattern = /!\[(media:\d+)\]\(([^)]*)\)/g

  return content.replace(pattern, (match, mediaTag, link) => {
    if (link === mediaTag) return match
    return `![${mediaTag}](${mediaTag})`
  })
}

/**
 * Extract all media IDs from content (both image and alt patterns)
 * @param content - Content string to extract media IDs from
 * @returns Set of unique media IDs found in the content
 */
export function extractAllMediaIds(content: string): Set<number> {
  const mediaIds = new Set<number>()
  if (!content) return mediaIds

  // Extract from image markdown
  const imageIds = extractMediaIdsFromImages(content)
  imageIds.forEach((id) => mediaIds.add(id))

  // Extract from alt text
  const altIds = extractMediaIdsFromAlt(content)
  altIds.forEach((id) => mediaIds.add(id))

  return mediaIds
}
