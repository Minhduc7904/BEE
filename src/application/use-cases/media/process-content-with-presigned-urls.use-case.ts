// src/application/use-cases/media/process-content-with-presigned-urls.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { extractMediaIdsFromAlt } from '../../../shared/utils'

export interface ContentField {
  fieldName: string
  content: string | null
}

export interface ProcessedContentField {
  fieldName: string
  originalContent: string | null
  processedContent: string | null
}

@Injectable()
export class ProcessContentWithPresignedUrlsUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  /**
   * Process one or multiple content fields by replacing media markdown
   * with presigned URLs
   * 
   * @param fields Array of content fields to process
   * @param expirySeconds URL expiry time in seconds (default: 3600 = 1 hour)
   * @returns Array of processed content fields
   */
  async execute(
    fields: ContentField[],
    expirySeconds = 3600,
  ): Promise<ProcessedContentField[]> {
    // Step 1: Extract all media IDs from all content fields
    const allMediaIds = new Set<number>()

    for (const field of fields) {
      if (field.content) {
        const mediaIds = extractMediaIdsFromAlt(field.content)
        mediaIds.forEach((id) => allMediaIds.add(id))
      }
    }

    // Step 2: Generate presigned URLs for all media IDs
    const mediaIdToUrlMap = await this.generatePresignedUrls(
      Array.from(allMediaIds),
      expirySeconds,
    )

    // Step 3: Process each content field
    const results: ProcessedContentField[] = fields.map((field) => {
      if (!field.content) {
        return {
          fieldName: field.fieldName,
          originalContent: field.content,
          processedContent: field.content,
        }
      }

      const processedContent = this.replaceMarkdownImages(
        field.content,
        mediaIdToUrlMap,
      )

      return {
        fieldName: field.fieldName,
        originalContent: field.content,
        processedContent,
      }
    })

    return results
  }

  /**
   * Helper method to get processed content by field name
   */
  getProcessedContent(
    results: ProcessedContentField[],
    fieldName: string,
  ): string | null {
    const found = results.find((r) => r.fieldName === fieldName)
    return found?.processedContent ?? null
  }

  /**
   * Generate presigned URLs for multiple media IDs
   */
  private async generatePresignedUrls(
    mediaIds: number[],
    expirySeconds: number,
  ): Promise<Map<number, string>> {
    const mediaIdToUrlMap = new Map<number, string>()

    if (mediaIds.length === 0) {
      return mediaIdToUrlMap
    }

    // Fetch all media from database
    const mediaList = await Promise.all(
      mediaIds.map((id) => this.mediaRepository.findById(id)),
    )

    const validMedia = mediaList.filter(
      (m): m is NonNullable<typeof m> => m !== null,
    )

    // Generate presigned URLs in parallel
    await Promise.all(
      validMedia.map(async (media) => {
        try {
          const url = await this.minioService.getPresignedUrl(
            media.bucketName,
            media.objectKey,
            expirySeconds,
          )
          mediaIdToUrlMap.set(media.mediaId, url)
        } catch (error) {
          console.error(
            `Failed to generate presigned URL for media ${media.mediaId}:`,
            error,
          )
        }
      }),
    )

    return mediaIdToUrlMap
  }

  /**
   * Replace markdown images with presigned URLs
   * Pattern: ![media:75](media:75) -> ![media:75](presigned-url)
   */
  private replaceMarkdownImages(
    content: string,
    mediaIdToUrlMap: Map<number, string>,
  ): string {
    const imagePattern = /!\[media:(\d+)\]\([^)]+\)/g
    return content.replace(imagePattern, (fullMatch, mediaIdStr) => {
      const id = Number(mediaIdStr)
      const url = mediaIdToUrlMap.get(id)
      if (!url) return fullMatch
      return `![media:${id}](${url})`
    })
  }
}
