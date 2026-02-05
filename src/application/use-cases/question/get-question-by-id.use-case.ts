// src/application/use-cases/question/get-question-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { QuestionResponseDto } from '../../dtos/question/question.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetQuestionByIdUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
  ) { }

  async execute(questionId: number, expirySeconds = 3600): Promise<BaseResponseDto<QuestionResponseDto>> {
    const question = await this.questionRepository.findById(questionId)

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi')
    }

    const questionResponse = QuestionResponseDto.fromEntity(question)

    // Prepare all content fields to process
    const contentFields: ContentField[] = [
      { fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: questionResponse.content },
    ]

    if (questionResponse.solution) {
      contentFields.push({ fieldName: QUESTION_CONTENT_FIELDS.SOLUTION, content: questionResponse.solution })
    }

    // Add statement contents
    if (questionResponse.statements) {
      questionResponse.statements.forEach((stmt, index) => {
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
    questionResponse.processedContent = this.processContentUseCase.getProcessedContent(
      processedResults,
      QUESTION_CONTENT_FIELDS.CONTENT,
    ) || questionResponse.content

    if (questionResponse.solution) {
      questionResponse.processedSolution = this.processContentUseCase.getProcessedContent(
        processedResults,
        QUESTION_CONTENT_FIELDS.SOLUTION,
      ) || questionResponse.solution
    }

    if (questionResponse.statements) {
      questionResponse.statements.forEach((stmt, index) => {
        stmt.processedContent = this.processContentUseCase.getProcessedContent(
          processedResults,
          `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
        ) || stmt.content
      })
    }

    return {
      success: true,
      message: 'Lấy thông tin câu hỏi thành công',
      data: questionResponse,
    }
  }
}
