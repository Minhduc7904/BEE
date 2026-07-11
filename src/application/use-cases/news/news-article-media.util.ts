import { NewsArticleResponseDto } from 'src/application/dtos'
import type { MediaEntity } from 'src/domain/entities'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { NEWS_ARTICLE_MEDIA_FIELDS } from 'src/shared/constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaStatus, MediaVisibility } from 'src/shared/enums'
import { NotFoundException, ValidationException } from 'src/shared/exceptions/custom-exceptions'

export const NEWS_ARTICLE_MEDIA_URL_EXPIRY_SECONDS = 3600 * 24

type TiptapNode = Record<string, unknown>

export function normalizeTiptapContentForStorage(content: TiptapNode): TiptapNode {
  const normalized = cloneJson(content)

  walkTiptapNodes(normalized, (node) => {
    const attrs = getAttrs(node)
    if (!attrs) return

    normalizeNodeAlt(attrs)
    if (attrs.mediaId === undefined) return

    assertMediaId(attrs.mediaId)
    delete attrs.src
    delete attrs.viewUrl
  })

  return normalized
}

export function extractTiptapMediaIds(content: TiptapNode): number[] {
  const mediaIds = new Set<number>()

  walkTiptapNodes(content, (node) => {
    const mediaId = getAttrs(node)?.mediaId
    if (mediaId === undefined) return

    assertMediaId(mediaId)
    mediaIds.add(mediaId)
  })

  return Array.from(mediaIds)
}

export function extractTiptapPlainText(content: TiptapNode): string {
  const textParts: string[] = []

  walkTiptapNodes(content, (node) => {
    if (typeof node.text === 'string' && node.text.trim()) {
      textParts.push(node.text.trim())
    }
  })

  return textParts.join(' ')
}

export async function syncNewsArticleContentMediaUsages(
  repos: UnitOfWorkRepos,
  newsArticleId: number,
  contentJson: TiptapNode,
  userId?: number,
): Promise<void> {
  const newMediaIds = extractTiptapMediaIds(contentJson)
  await assertReadyMedias(repos, newMediaIds)

  const currentUsages = await repos.mediaUsageRepository.findByEntity(
    EntityType.NEWS_ARTICLE,
    newsArticleId,
    NEWS_ARTICLE_MEDIA_FIELDS.CONTENT,
  )
  const newMediaIdSet = new Set(newMediaIds)
  const currentMediaIdSet = new Set(currentUsages.map((usage) => usage.mediaId))

  for (const usage of currentUsages) {
    if (!newMediaIdSet.has(usage.mediaId)) {
      await repos.mediaUsageRepository.detach(usage.usageId)
    }
  }

  for (const mediaId of newMediaIds) {
    if (currentMediaIdSet.has(mediaId)) continue

    await repos.mediaUsageRepository.attach({
      mediaId,
      entityType: EntityType.NEWS_ARTICLE,
      entityId: newsArticleId,
      fieldName: NEWS_ARTICLE_MEDIA_FIELDS.CONTENT,
      usedBy: userId,
      visibility: MediaVisibility.PUBLIC,
    })
  }
}

export async function syncNewsArticleThumbnailUsage(
  repos: UnitOfWorkRepos,
  newsArticleId: number,
  thumbnailMediaId: number | null,
  userId?: number,
): Promise<void> {
  if (thumbnailMediaId !== null) {
    await assertReadyMedias(repos, [thumbnailMediaId])
  }

  const currentUsages = await repos.mediaUsageRepository.findByEntity(
    EntityType.NEWS_ARTICLE,
    newsArticleId,
    NEWS_ARTICLE_MEDIA_FIELDS.THUMBNAIL,
  )

  for (const usage of currentUsages) {
    await repos.mediaUsageRepository.detach(usage.usageId)
  }

  if (thumbnailMediaId === null) return

  await repos.mediaUsageRepository.attach({
    mediaId: thumbnailMediaId,
    entityType: EntityType.NEWS_ARTICLE,
    entityId: newsArticleId,
    fieldName: NEWS_ARTICLE_MEDIA_FIELDS.THUMBNAIL,
    usedBy: userId,
    visibility: MediaVisibility.PUBLIC,
  })
}

export async function attachNewsArticleMediaUrls(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  item: NewsArticleResponseDto,
  options?: { includeContentMedia?: boolean },
): Promise<void> {
  const includeContentMedia = options?.includeContentMedia ?? true
  const usages = await unitOfWork.executeInTransaction((repos) =>
    repos.mediaUsageRepository.findByEntity(
      EntityType.NEWS_ARTICLE,
      item.newsArticleId,
      includeContentMedia ? undefined : NEWS_ARTICLE_MEDIA_FIELDS.THUMBNAIL,
    ),
  )
  const contentMediaById = new Map<number, string>()

  item.thumbnailMediaId = null
  item.thumbnailViewUrl = null
  if (includeContentMedia) item.contentMedia = []

  await Promise.all(usages.map(async (usage) => {
    const viewUrl = await resolveMediaUrl(minioService, usage.media)
    if (!viewUrl) return

    if (usage.fieldName === NEWS_ARTICLE_MEDIA_FIELDS.THUMBNAIL) {
      item.thumbnailMediaId = usage.mediaId
      item.thumbnailViewUrl = viewUrl
      return
    }

    if (usage.fieldName === NEWS_ARTICLE_MEDIA_FIELDS.CONTENT) {
      if (!includeContentMedia) return

      contentMediaById.set(usage.mediaId, viewUrl)
      item.contentMedia!.push({
        mediaId: usage.mediaId,
        type: usage.media?.type || 'OTHER',
        mimeType: usage.media?.mimeType || '',
        viewUrl,
      })
    }
  }))

  if (includeContentMedia) {
    item.contentMedia!.sort((left, right) => left.mediaId - right.mediaId)
    item.contentJson = item.contentJson
      ? hydrateTiptapContentWithUrls(item.contentJson, contentMediaById)
      : null
    item.contentHtml = replaceMediaPlaceholders(item.contentHtml, contentMediaById)
  }
}

function hydrateTiptapContentWithUrls(content: TiptapNode, mediaUrls: Map<number, string>): TiptapNode {
  const hydrated = cloneJson(content)

  walkTiptapNodes(hydrated, (node) => {
    const attrs = getAttrs(node)
    if (!attrs || typeof attrs.mediaId !== 'number') return

    const viewUrl = mediaUrls.get(attrs.mediaId)
    if (!viewUrl) return

    attrs.src = viewUrl
    attrs.viewUrl = viewUrl
  })

  return hydrated
}

function replaceMediaPlaceholders(contentHtml: string | null, mediaUrls: Map<number, string>): string | null {
  if (!contentHtml || mediaUrls.size === 0) return contentHtml

  return contentHtml.replace(/media:(\d+)/g, (value, mediaIdText) => mediaUrls.get(Number(mediaIdText)) || value)
}

async function assertReadyMedias(repos: UnitOfWorkRepos, mediaIds: number[]): Promise<void> {
  if (!mediaIds.length) return

  const medias = await repos.mediaRepository.findByIds(mediaIds)
  const mediaById = new Map(medias.map((media) => [media.mediaId, media]))
  const missingMediaId = mediaIds.find((mediaId) => !mediaById.has(mediaId))
  if (missingMediaId !== undefined) {
    throw new NotFoundException(`Khong tim thay media ${missingMediaId}`)
  }

  const unavailableMedia = medias.find((media) => media.status !== MediaStatus.READY)
  if (unavailableMedia) {
    throw new ValidationException(`Media ${unavailableMedia.mediaId} chua san sang de su dung`)
  }
}

async function resolveMediaUrl(minioService: MinioService, media: MediaEntity | null): Promise<string | null> {
  if (!media || media.status !== MediaStatus.READY) return null

  try {
    return await minioService.getPresignedUrl(
      media.bucketName,
      media.objectKey,
      NEWS_ARTICLE_MEDIA_URL_EXPIRY_SECONDS,
    )
  } catch {
    return null
  }
}

function walkTiptapNodes(value: unknown, visitor: (node: TiptapNode) => void): void {
  if (Array.isArray(value)) {
    value.forEach((item) => walkTiptapNodes(item, visitor))
    return
  }

  if (!isObject(value)) return
  visitor(value)

  for (const child of Object.values(value)) {
    walkTiptapNodes(child, visitor)
  }
}

function getAttrs(node: TiptapNode): TiptapNode | null {
  return isObject(node.attrs) ? node.attrs : null
}

function assertMediaId(value: unknown): asserts value is number {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new ValidationException('attrs.mediaId trong noi dung Tiptap phai la so nguyen duong')
  }
}

function normalizeNodeAlt(attrs: TiptapNode): void {
  if (attrs.alt === undefined) return

  if (typeof attrs.alt !== 'string') {
    throw new ValidationException('attrs.alt trong noi dung Tiptap phai la chuoi')
  }

  const alt = attrs.alt.trim()
  if (alt.length > 500) {
    throw new ValidationException('attrs.alt trong noi dung Tiptap khong duoc vuot qua 500 ky tu')
  }

  attrs.alt = alt
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isObject(value: unknown): value is TiptapNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
