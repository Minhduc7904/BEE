// src/application/use-cases/question/get-questions-by-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories'
import { QuestionByExamQueryDto } from '../../dtos/question/question-by-exam-query.dto'
import { QuestionListResponseDto, QuestionResponseDto } from '../../dtos/question/question.dto'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetQuestionsByExamUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
  ) {}

  async execute(examId: number, query: QuestionByExamQueryDto, expirySeconds = 3600): Promise<QuestionListResponseDto> {
    const filters = {
      examId,
      type: query.type,
      difficulty: query.difficulty,
      search: query.search,
    }

    const pagination = {
      page: query.page || 1,
      limit:  100,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || SortOrder.DESC,
    }

    const result = await this.questionRepository.findAllWithPagination(pagination, filters)

    const questionResponses = QuestionResponseDto.fromEntities(result.questions)

    // Process all questions with presigned URLs
    for (const dto of questionResponses) {
      // Prepare content fields for this question
      const contentFields: ContentField[] = [
        { fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: dto.content },
      ]

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

      // Process all contents at once
      const processedResults = await this.processContentUseCase.execute(
        contentFields,
        expirySeconds,
      )

      // Map processed contents back to response
      dto.processedContent = this.processContentUseCase.getProcessedContent(
        processedResults,
        QUESTION_CONTENT_FIELDS.CONTENT,
      ) || dto.content

      if (dto.solution) {
        dto.processedSolution = this.processContentUseCase.getProcessedContent(
          processedResults,
          QUESTION_CONTENT_FIELDS.SOLUTION,
        ) || dto.solution
      }

      if (dto.statements) {
        dto.statements.forEach((stmt, index) => {
          stmt.processedContent = this.processContentUseCase.getProcessedContent(
            processedResults,
            `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
          ) || stmt.content
        })
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
