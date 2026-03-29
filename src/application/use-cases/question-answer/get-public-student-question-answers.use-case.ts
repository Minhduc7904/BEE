import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionAnswerRepository, IStudentRepository } from '../../../domain/repositories'
import { StudentQuestionAnswerListQueryDto } from '../../dtos/question-answer/student-question-answer-list-query.dto'
import {
  StudentQuestionAnswerItemDto,
  StudentQuestionAnswerListResponseDto,
} from '../../dtos/question-answer/student-question-answer.dto'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import {
  ForbiddenException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetPublicStudentQuestionAnswersUseCase {
  constructor(
    @Inject('IQuestionAnswerRepository')
    private readonly questionAnswerRepository: IQuestionAnswerRepository,
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
    private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
  ) {}

  async execute(
    studentId: number,
    query: StudentQuestionAnswerListQueryDto,
  ): Promise<StudentQuestionAnswerListResponseDto> {
    const student = await this.studentRepository.findById(studentId)

    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const pagination = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }

    const result = await this.questionAnswerRepository.findPublicByStudentWithPagination(
      studentId,
      pagination,
      {
        examId: query.examId,
        attemptId: query.attemptId,
        questionId: query.questionId,
      },
    )

    const questionAnswers = result.questionAnswers.map((item) =>
      StudentQuestionAnswerItemDto.fromEntity(item),
    )

    const contentFields: ContentField[] = []
    for (const item of questionAnswers) {
      if (item.questionContent) {
        contentFields.push({
          fieldName: `Q${item.questionId}_${QUESTION_CONTENT_FIELDS.CONTENT}`,
          content: item.questionContent,
        })
      }

      if (item.statements) {
        for (const statement of item.statements) {
          contentFields.push({
            fieldName: `Q${item.questionId}_S${statement.statementId}_CONTENT`,
            content: statement.content,
          })
        }
      }
    }

    if (contentFields.length > 0) {
      const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields)

      for (const item of questionAnswers) {
        if (item.questionContent) {
          item.processedQuestionContent =
            this.processContentAndRenderHtmlUseCase.getProcessedContent(
              processedResults,
              `Q${item.questionId}_${QUESTION_CONTENT_FIELDS.CONTENT}`,
            ) ?? item.questionContent
        }

        if (item.statements) {
          for (const statement of item.statements) {
            statement.processedContent =
              this.processContentAndRenderHtmlUseCase.getProcessedContent(
                processedResults,
                `Q${item.questionId}_S${statement.statementId}_CONTENT`,
              ) ?? statement.content
          }
        }
      }
    }

    return StudentQuestionAnswerListResponseDto.fromResult(
      questionAnswers,
      result.page,
      result.limit,
      result.total,
    )
  }
}
