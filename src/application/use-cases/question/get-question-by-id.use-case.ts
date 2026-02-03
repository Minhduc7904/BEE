// src/application/use-cases/question/get-question-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository, IMediaRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { QuestionResponseDto } from '../../dtos/question/question.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { extractMediaIdsFromAlt } from '../../../shared/utils'

@Injectable()
export class GetQuestionByIdUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(questionId: number, expirySeconds = 3600): Promise<BaseResponseDto<QuestionResponseDto>> {
    const question = await this.questionRepository.findById(questionId)

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi')
    }

    const questionResponse = QuestionResponseDto.fromEntity(question)

    /* ------------------------------------------------------------------
     * Extract all mediaIds from question and statements
     * ------------------------------------------------------------------ */
    const allMediaIds = new Set<number>()

    // Extract from question content
    const contentMediaIds = extractMediaIdsFromAlt(questionResponse.content)
    contentMediaIds.forEach((id) => allMediaIds.add(id))

    // Extract from solution
    if (questionResponse.solution) {
      const solutionMediaIds = extractMediaIdsFromAlt(questionResponse.solution)
      solutionMediaIds.forEach((id) => allMediaIds.add(id))
    }

    // Extract from statements
    if (questionResponse.statements) {
      for (const stmt of questionResponse.statements) {
        const stmtMediaIds = extractMediaIdsFromAlt(stmt.content)
        stmtMediaIds.forEach((id) => allMediaIds.add(id))
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
     * Process question and statements
     * ------------------------------------------------------------------ */
    // Process question content
    questionResponse.processedContent = replaceMarkdownImages(questionResponse.content)

    // Process solution
    if (questionResponse.solution) {
      questionResponse.processedSolution = replaceMarkdownImages(questionResponse.solution)
    }

    // Process statements
    if (questionResponse.statements) {
      for (const stmt of questionResponse.statements) {
        stmt.processedContent = replaceMarkdownImages(stmt.content)
      }
    }

    return {
      success: true,
      message: 'Lấy thông tin câu hỏi thành công',
      data: questionResponse,
    }
  }
}
