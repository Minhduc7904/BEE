// src/application/use-cases/media/process-content-with-presigned-urls.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories'
import { MinioService } from 'src/application/interfaces'
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

interface ResolvedMediaContent {
  url: string
  alt?: string
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
    const mediaIdToContentMap = await this.generatePresignedMediaContent(
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
        mediaIdToContentMap,
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
  private async generatePresignedMediaContent(
    mediaIds: number[],
    expirySeconds: number,
  ): Promise<Map<number, ResolvedMediaContent>> {
    const mediaIdToContentMap = new Map<number, ResolvedMediaContent>()

    if (mediaIds.length === 0) {
      return mediaIdToContentMap
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
          mediaIdToContentMap.set(media.mediaId, {
            url,
            alt: media.alt,
          })
        } catch (error) {
          console.error(
            `Failed to generate presigned URL for media ${media.mediaId}:`,
            error,
          )
        }
      }),
    )

    return mediaIdToContentMap
  }

  /**
   * Replace markdown images with presigned URLs
   * Pattern: ![media:75](media:75) -> ![media:75](presigned-url)
   */
  private replaceMarkdownImages(
    content: string,
    mediaIdToContentMap: Map<number, ResolvedMediaContent>,
  ): string {
    const imagePattern = /!\[media:(\d+)\]\([^)]+\)/g
    return content.replace(imagePattern, (fullMatch, mediaIdStr) => {
      const id = Number(mediaIdStr)
      const mediaContent = mediaIdToContentMap.get(id)
      if (!mediaContent) return fullMatch

      const alt = this.escapeMarkdownAlt(mediaContent.alt || `media:${id}`)
      return `![${alt}](${mediaContent.url})`
    })
  }

  private escapeMarkdownAlt(value: string): string {
    return value.replace(/[\[\]\r\n]/g, ' ').trim()
  }
}
