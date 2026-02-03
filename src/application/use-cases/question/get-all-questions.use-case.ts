// src/application/use-cases/question/get-all-questions.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository, IMediaRepository } from '../../../domain/repositories'
import { QuestionListQueryDto } from '../../dtos/question/question-list-query.dto'
import { QuestionListResponseDto, QuestionResponseDto } from '../../dtos/question/question.dto'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { extractMediaIdsFromAlt } from '../../../shared/utils'

@Injectable()
export class GetAllQuestionsUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: QuestionListQueryDto, expirySeconds = 3600): Promise<QuestionListResponseDto> {
    const filters = {
      subjectId: query.subjectId,
      type: query.type,
      difficulty: query.difficulty,
      grade: query.grade,
      visibility: query.visibility,
      createdBy: query.createdBy,
      chapterId: query.chapterId,
      search: query.search,
    }

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || SortOrder.DESC,
    }

    const result = await this.questionRepository.findAllWithPagination(pagination, filters)

    const questionResponses = QuestionResponseDto.fromEntities(result.questions)

    /* ------------------------------------------------------------------
     * Extract all mediaIds from questions and statements
     * ------------------------------------------------------------------ */
    const allMediaIds = new Set<number>()

    for (const dto of questionResponses) {
      // Extract from question content
      const contentMediaIds = extractMediaIdsFromAlt(dto.content)
      contentMediaIds.forEach((id) => allMediaIds.add(id))

      // Extract from solution
      if (dto.solution) {
        const solutionMediaIds = extractMediaIdsFromAlt(dto.solution)
        solutionMediaIds.forEach((id) => allMediaIds.add(id))
      }

      // Extract from statements
      if (dto.statements) {
        for (const stmt of dto.statements) {
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
    for (const dto of questionResponses) {
      // Process question content
      dto.processedContent = replaceMarkdownImages(dto.content)

      // Process solution
      if (dto.solution) {
        dto.processedSolution = replaceMarkdownImages(dto.solution)
      }

      // Process statements
      if (dto.statements) {
        for (const stmt of dto.statements) {
          stmt.processedContent = replaceMarkdownImages(stmt.content)
        }
      }
    }

    return new QuestionListResponseDto(
      questionResponses,
      result.page,
      result.limit,
      result.total,
    )
  }
}
