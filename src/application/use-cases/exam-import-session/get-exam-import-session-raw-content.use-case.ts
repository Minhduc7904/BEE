// src/application/use-cases/exam-import-session/get-exam-import-session-raw-content.use-case.ts
import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { MediaRawContentResponseDto } from '../../dtos/media/media-raw-content-response.dto'

@Injectable()
export class GetExamImportSessionRawContentUseCase {
  constructor(
    @Inject('IExamImportSessionRepository')
    private readonly examImportSessionRepository: IExamImportSessionRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    sessionId: number,
    userId: number,
    expirySeconds = 3600,
  ): Promise<BaseResponseDto<MediaRawContentResponseDto>> {
    /* ------------------------------------------------------------------
     * 1. Find exam import session
     * ------------------------------------------------------------------ */
    const session = await this.examImportSessionRepository.findById(sessionId)
    if (!session) {
      throw new NotFoundException('Exam import session not found')
    }

    /* ------------------------------------------------------------------
     * 2. Ownership check
     * ------------------------------------------------------------------ */
    if (session.createdBy !== userId) {
      throw new ForbiddenException('You can only access your own exam import sessions')
    }

    /* ------------------------------------------------------------------
     * 3. Raw content check
     * ------------------------------------------------------------------ */
    if (!session.rawContent) {
      return BaseResponseDto.success('No content found', {
        mediaId: sessionId,
        rawContent: '',
        processedContent: '',
        childMediaCount: 0,
        metadata: {
          replacedImagesCount: 0,
          childMediaIds: [],
        },
      })
    }

    const rawContent = session.rawContent

    /* ------------------------------------------------------------------
     * 4. Extract mediaIds from ALT: [media:123]
     * ------------------------------------------------------------------ */
    const mediaIdPattern = /\[media:(\d+)\]/g
    const mediaIds = new Set<number>()
    let match: RegExpExecArray | null

    while ((match = mediaIdPattern.exec(rawContent)) !== null) {
      mediaIds.add(Number(match[1]))
    }

    /* ------------------------------------------------------------------
     * 5. Generate presigned URLs
     * ------------------------------------------------------------------ */
    const mediaIdToUrlMap = new Map<number, string>()

    if (mediaIds.size > 0) {
      const childMediaList = await Promise.all(
        Array.from(mediaIds).map((id) => this.mediaRepository.findById(id)),
      )

      const validMedia = childMediaList.filter(
        (m): m is NonNullable<typeof m> => m !== null,
      )

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
    }

    /* ------------------------------------------------------------------
     * 6. Replace markdown images
     * Pattern: ![media:75](media:75)
     * 👉 mediaId lấy từ ALT
     * ------------------------------------------------------------------ */
    let replacedImagesCount = 0

    const imagePattern = /!\[media:(\d+)\]\([^)]+\)/g

    const processedContent = rawContent.replace(
      imagePattern,
      (fullMatch, mediaIdStr) => {
        const id = Number(mediaIdStr)
        const url = mediaIdToUrlMap.get(id)

        if (!url) return fullMatch

        replacedImagesCount++
        return `![media:${id}](${url})`
      },
    )

    /* ------------------------------------------------------------------
     * 7. Return response
     * ------------------------------------------------------------------ */
    return BaseResponseDto.success('Raw content retrieved successfully', {
      mediaId: sessionId,
      rawContent,
      processedContent,
      childMediaCount: mediaIds.size,
      metadata: {
        replacedImagesCount,
        childMediaIds: Array.from(mediaIds),
      },
    })
  }
}
