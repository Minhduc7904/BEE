// src/application/use-cases/question/search-questions.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories'
import { SearchQuestionsDto } from '../../dtos/question/search-questions.dto'
import { QuestionListResponseDto, QuestionResponseDto } from '../../dtos/question/question.dto'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import {
  ProcessContentWithPresignedUrlsUseCase,
  type ContentField,
} from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

@Injectable()
export class SearchQuestionsUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
  ) {}

  async execute(query: SearchQuestionsDto, expirySeconds = 3600): Promise<QuestionListResponseDto> {
    // Build filters object
    const filters = {
      subjectId: query.subjectId,
      type: query.type,
      difficulty: query.difficulty,
      grade: query.grade,
      chapterIds: query.chapterIds,
      search: query.content, // Use content field for search
      excludeQuestionIds: query.excludeQuestionIds,
    }

    // Build pagination object
    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || SortOrder.DESC,
    }

    // Execute search query
    const result = await this.questionRepository.findAllWithPagination(pagination, filters)

    // Convert entities to DTOs
    const questionResponses = QuestionResponseDto.fromEntities(result.questions)

    // Calculate relevance score if search term exists
    if (query.content) {
      for (const dto of questionResponses) {
        // Calculate relevance based on searchableContent or content
        const textToScore = dto.content || ''
        dto.relevanceScore = TextSearchUtil.calculateRelevanceScore(textToScore, query.content)
      }

      // Sort by relevance score (highest first) when searching
      questionResponses.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    }

    // Process all questions with presigned URLs for media content
    // Performance: This runs sequentially but each question's media is processed in parallel
    for (const dto of questionResponses) {
      // Prepare content fields for this question
      const contentFields: ContentField[] = [{ fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: dto.content }]

      if (dto.solution) {
        contentFields.push({ fieldName: QUESTION_CONTENT_FIELDS.SOLUTION, content: dto.solution })
      }

      // Add statement contents
      if (dto.statements) {
        dto.statements.forEach((stmt, index) => {
          contentFields.push({
            fieldName: `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
            content: stmt.content,
          })
        })
      }

      // Process all contents at once to generate presigned URLs
      const processedResults = await this.processContentUseCase.execute(contentFields, expirySeconds)

      // Map processed contents back to response
      dto.processedContent =
        this.processContentUseCase.getProcessedContent(processedResults, QUESTION_CONTENT_FIELDS.CONTENT) || dto.content

      if (dto.solution) {
        dto.processedSolution =
          this.processContentUseCase.getProcessedContent(processedResults, QUESTION_CONTENT_FIELDS.SOLUTION) ||
          dto.solution
      }

      if (dto.statements) {
        dto.statements.forEach((stmt, index) => {
          stmt.processedContent =
            this.processContentUseCase.getProcessedContent(
              processedResults,
              `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
            ) || stmt.content
        })
      }
    }

    // Return paginated response
    return new QuestionListResponseDto(questionResponses, result.page, result.limit, result.total)
  }
}
