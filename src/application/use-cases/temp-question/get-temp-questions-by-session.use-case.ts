// src/application/use-cases/temp-question/get-temp-questions-by-session.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ITempQuestionRepository } from '../../../domain/repositories/temp-question.repository'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { TempQuestionResponseDto } from '../../dtos/temp-question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { extractMediaIdsFromAlt } from '../../../shared/utils'

@Injectable()
export class GetTempQuestionsBySessionUseCase {
  constructor(
    @Inject('ITempQuestionRepository')
    private readonly tempQuestionRepository: ITempQuestionRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) { }

  async execute(
    sessionId: number,
    expirySeconds = 3600,
  ): Promise<BaseResponseDto<TempQuestionResponseDto[]>> {
    const tempQuestions = await this.tempQuestionRepository.findBySessionId(sessionId)

    // Convert entities to DTOs
    const questionDtos = TempQuestionResponseDto.fromEntities(tempQuestions)

    /* ------------------------------------------------------------------
     * Extract all mediaIds from questions and statements
     * ------------------------------------------------------------------ */
    const allMediaIds = new Set<number>()

    for (const dto of questionDtos) {
      // Extract from question content
      const contentMediaIds = extractMediaIdsFromAlt(dto.content)
      contentMediaIds.forEach((id) => allMediaIds.add(id))

      // Extract from solution
      if (dto.solution) {
        const solutionMediaIds = extractMediaIdsFromAlt(dto.solution)
        solutionMediaIds.forEach((id) => allMediaIds.add(id))
      }

      // Extract from statements
      if (dto.tempStatements) {
        for (const stmt of dto.tempStatements) {
          const stmtMediaIds = extractMediaIdsFromAlt(stmt.content)
          stmtMediaIds.forEach((id) => allMediaIds.add(id))
        }
      }
    }

    /* ------------------------------------------------------------------
     * Generate presigned URLs for all mediaIds
     * ------------------------------------------------------------------ */
    const mediaIdToUrlMap = new Map<number, string>()

    if (allMediaIds.size > 0) {
      const mediaList = await Promise.all(
        Array.from(allMediaIds).map((id) => this.mediaRepository.findById(id)),
      )

      const validMedia = mediaList.filter(
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
     * Helper function to replace markdown images
     * Pattern: ![media:75](media:75) -> ![media:75](presigned-url)
     * ------------------------------------------------------------------ */
    const replaceMarkdownImages = (content: string): string => {
      const imagePattern = /!\[media:(\d+)\]\([^)]+\)/g
      return content.replace(imagePattern, (fullMatch, mediaIdStr) => {
        const id = Number(mediaIdStr)
        const url = mediaIdToUrlMap.get(id)
        if (!url) return fullMatch
        return `![media:${id}](${url})`
      })
    }

    /* ------------------------------------------------------------------
     * Process each question and statement
     * ------------------------------------------------------------------ */
    for (const dto of questionDtos) {
      // Process question content
      dto.processedContent = replaceMarkdownImages(dto.content)

      // Process solution
      if (dto.solution) {
        dto.processedSolution = replaceMarkdownImages(dto.solution)
      }

      // Process statements
      if (dto.tempStatements) {
        for (const stmt of dto.tempStatements) {
          stmt.processedContent = replaceMarkdownImages(stmt.content)
        }
      }
    }

    return {
      success: true,
      message: `Lấy danh sách câu hỏi tạm thời thành công`,
      data: questionDtos,
    }
  }
}
