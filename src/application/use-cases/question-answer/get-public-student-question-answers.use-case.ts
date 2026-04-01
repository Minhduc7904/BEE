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
    const mergedContentByQuestionAnswerId = new Map<number, string>()

    for (const item of questionAnswers) {
      const mergedContent = this.mergeQuestionAndStatementsContent(item)

      if (mergedContent) {
        mergedContentByQuestionAnswerId.set(item.questionAnswerId, mergedContent)
        contentFields.push({
          fieldName: `QA${item.questionAnswerId}_${QUESTION_CONTENT_FIELDS.CONTENT}`,
          content: mergedContent,
        })
      }
    }

    if (contentFields.length > 0) {
      const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields)

      for (const item of questionAnswers) {
        const mergedContent = mergedContentByQuestionAnswerId.get(item.questionAnswerId)

        if (mergedContent) {
          item.processedQuestionContent =
            this.processContentAndRenderHtmlUseCase.getProcessedContent(
              processedResults,
              `QA${item.questionAnswerId}_${QUESTION_CONTENT_FIELDS.CONTENT}`,
            ) ?? mergedContent
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

  private mergeQuestionAndStatementsContent(item: StudentQuestionAnswerItemDto): string | undefined {
    const segments: string[] = []

    if (item.questionContent?.trim()) {
      segments.push(item.questionContent.trim())
    }

    const validStatements = (item.statements ?? []).filter((statement) => statement.content?.trim())

    if (validStatements.length > 0) {
      const statementsBlock = validStatements
        .map((statement, index) => `${index + 1}. ${statement.content.trim()}`)
        .join('\n')
      segments.push(statementsBlock)
    }

    if (segments.length === 0) {
      return undefined
    }

    return segments.join('\n\n')
  }
}
