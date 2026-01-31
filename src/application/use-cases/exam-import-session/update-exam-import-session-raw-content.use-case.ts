// src/application/use-cases/exam-import-session/update-exam-import-session-raw-content.use-case.ts
import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from '../../../shared/constants/entity-type.constants'

@Injectable()
export class UpdateExamImportSessionRawContentUseCase {
  constructor(
    @Inject('IExamImportSessionRepository')
    private readonly examImportSessionRepository: IExamImportSessionRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) {}

  async execute(
    sessionId: number,
    userId: number,
    newRawContent: string,
  ): Promise<BaseResponseDto<{ sessionId: number; rawContent: string; deletedMediaCount: number }>> {
    /* ------------------------------------------------------------------
     * 1. Find session
     * ------------------------------------------------------------------ */
    const session = await this.examImportSessionRepository.findById(sessionId)
    if (!session) {
      throw new NotFoundException('Exam import session not found')
    }

    /* ------------------------------------------------------------------
     * 2. Ownership check
     * ------------------------------------------------------------------ */
    if (session.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own exam import sessions')
    }

    /* ------------------------------------------------------------------
     * 3. Normalize markdown
     * ![media:75](anything) → ![media:75](media:75)
     * ------------------------------------------------------------------ */
    const normalizedRawContent = this.normalizeMediaMarkdown(newRawContent)

    /* ------------------------------------------------------------------
     * 4. Extract media IDs from image markdown
     * ------------------------------------------------------------------ */
    const oldMediaIds = this.extractMediaIdsFromImages(session.rawContent || '')
    const newMediaIds = this.extractMediaIdsFromImages(normalizedRawContent)

    /* ------------------------------------------------------------------
     * 5. Attach NEW media usage
     * ------------------------------------------------------------------ */
    await Promise.all(
      Array.from(newMediaIds).map(async (mediaId) => {
        try {
          const media = await this.mediaRepository.findById(mediaId)
          if (!media) return

          const exists = await this.mediaUsageRepository.exists(mediaId, EntityType.EXAM_IMPORT_SESSION, sessionId)

          if (!exists) {
            await this.mediaUsageRepository.attach({
              mediaId,
              entityType: EntityType.EXAM_IMPORT_SESSION,
              entityId: sessionId,
              usedBy: userId,
            })
          }
        } catch (err) {
          console.error(`Failed to attach media ${mediaId}`, err)
        }
      }),
    )

    /* ------------------------------------------------------------------
     * 6. Media removed from content → DETACH first
     * ------------------------------------------------------------------ */
    const removedMediaIds = Array.from(oldMediaIds).filter((id) => !newMediaIds.has(id))

    let deletedCount = 0

    await Promise.all(
      removedMediaIds.map(async (mediaId) => {
        try {
          // 6.1 Detach usage of THIS session (ALWAYS)
          const usages = await this.mediaUsageRepository.findByMedia(mediaId)

          const sessionUsage = usages.find(
            (u) => u.entityType === EntityType.EXAM_IMPORT_SESSION && u.entityId === sessionId,
          )

          if (sessionUsage) {
            await this.mediaUsageRepository.detach(sessionUsage.usageId)
          }

          // 6.2 Check remaining usages
          const remainingUsages = await this.mediaUsageRepository.findByMedia(mediaId)

          if (remainingUsages.length === 0) {
            await this.mediaRepository.softDelete(mediaId)
            deletedCount++
          }
        } catch (err) {
          console.error(`Failed to detach/delete media ${mediaId}`, err)
        }
      }),
    )

    /* ------------------------------------------------------------------
     * 7. Update session rawContent
     * ------------------------------------------------------------------ */
    const updatedSession = await this.examImportSessionRepository.update(sessionId, {
      rawContent: normalizedRawContent,
    })

    /* ------------------------------------------------------------------
     * 8. Response
     * ------------------------------------------------------------------ */
    return BaseResponseDto.success('Raw content updated successfully', {
      sessionId: updatedSession.sessionId,
      rawContent: updatedSession.rawContent!,
      deletedMediaCount: deletedCount,
    })
  }

  /* ==================================================================
   * Helpers
   * ================================================================== */

  /**
   * Normalize markdown:
   * ![media:123](ANYTHING) → ![media:123](media:123)
   */
  private normalizeMediaMarkdown(content: string): string {
    if (!content) return content

    const pattern = /!\[(media:\d+)\]\(([^)]*)\)/g

    return content.replace(pattern, (match, mediaTag, link) => {
      if (link === mediaTag) return match
      return `![${mediaTag}](${mediaTag})`
    })
  }

  /**
   * Extract media IDs ONLY from image markdown
   * Pattern: ![media:123](...)
   */
  private extractMediaIdsFromImages(content: string): Set<number> {
    const mediaIds = new Set<number>()
    const pattern = /!\[media:(\d+)\]\([^)]+\)/g
    let match: RegExpExecArray | null

    while ((match = pattern.exec(content)) !== null) {
      mediaIds.add(Number(match[1]))
    }

    return mediaIds
  }
}
