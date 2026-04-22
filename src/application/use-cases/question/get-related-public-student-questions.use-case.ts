import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository, IQuestionAnswerRepository, QuestionFilterOptions } from '../../../domain/repositories'
import { Question } from '../../../domain/entities/exam/question.entity'
import { QuestionListResponseDto, QuestionResponseDto, StudentQuestionAnswerSummaryDto } from '../../dtos/question/question.dto'
import { PublicStudentRelatedQuestionsQueryDto } from '../../dtos/question/public-student-related-questions-query.dto'
import { Difficulty, Visibility } from '../../../shared/enums'
import { SortOrder } from '../../../shared/enums/sort-order.enum'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import type { ContentField } from '../media/process-content-with-presigned-urls.use-case'

@Injectable()
export class GetRelatedPublicStudentQuestionsUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @Inject('IQuestionAnswerRepository')
    private readonly questionAnswerRepository: IQuestionAnswerRepository,
    private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
  ) {}

  async execute(
    questionId: number,
    query: PublicStudentRelatedQuestionsQueryDto,
    studentId?: number,
    expirySeconds = 3600,
  ): Promise<QuestionListResponseDto> {
    const baseQuestion = await this.questionRepository.findById(questionId)

    if (!baseQuestion || baseQuestion.visibility !== Visibility.PUBLISHED) {
      throw new NotFoundException('Không tìm thấy câu hỏi công khai')
    }

    const limit = query.limit || 10
    const chapterIds = baseQuestion.questionChapters?.map((item) => item.chapterId) ?? []

    const relatedQuestions = await this.findRelatedQuestions(questionId, limit, {
      subjectId: baseQuestion.subjectId ?? undefined,
      difficulty: baseQuestion.difficulty ?? undefined,
      grade: baseQuestion.grade ?? undefined,
      chapterIds,
    })

    const questionResponses = QuestionResponseDto.fromEntities(relatedQuestions)

    this.applyRelatedScore(questionResponses, {
      subjectId: baseQuestion.subjectId ?? undefined,
      difficulty: baseQuestion.difficulty ?? undefined,
      grade: baseQuestion.grade ?? undefined,
      chapterIds,
    })

    questionResponses.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

    if (studentId && questionResponses.length > 0) {
      const questionIds = questionResponses.map((item) => item.questionId)
      const studentAnswers = await this.questionAnswerRepository.findPublicByStudentAndQuestionIds(
        studentId,
        questionIds,
      )

      const answerMap = new Map<number, StudentQuestionAnswerSummaryDto[]>()
      for (const answer of studentAnswers) {
        const existing = answerMap.get(answer.questionId) ?? []
        existing.push(StudentQuestionAnswerSummaryDto.fromEntity(answer))
        answerMap.set(answer.questionId, existing)
      }

      questionResponses.forEach((item) => {
        item.studentQuestionAnswers = answerMap.get(item.questionId) ?? []
      })
    }

    await this.processQuestionContents(questionResponses, expirySeconds)

    return new QuestionListResponseDto(questionResponses, 1, limit, questionResponses.length)
  }

  private async findRelatedQuestions(
    currentQuestionId: number,
    limit: number,
    profile: {
      subjectId?: number
      difficulty?: Difficulty
      grade?: number
      chapterIds: number[]
    },
  ) {
    const candidates = new Map<number, Question>()
    const excludedIds = new Set<number>([currentQuestionId])

    const strategyFilters: QuestionFilterOptions[] = [
      {
        visibility: Visibility.PUBLISHED,
        subjectId: profile.subjectId,
        chapterIds: profile.chapterIds.length ? profile.chapterIds : undefined,
        difficulty: profile.difficulty,
        grade: profile.grade,
      },
      {
        visibility: Visibility.PUBLISHED,
        subjectId: profile.subjectId,
        chapterIds: profile.chapterIds.length ? profile.chapterIds : undefined,
        grade: profile.grade,
      },
      {
        visibility: Visibility.PUBLISHED,
        subjectId: profile.subjectId,
        difficulty: profile.difficulty,
        grade: profile.grade,
      },
      {
        visibility: Visibility.PUBLISHED,
        subjectId: profile.subjectId,
      },
      {
        visibility: Visibility.PUBLISHED,
        grade: profile.grade,
      },
    ]

    for (const filter of strategyFilters) {
      if (candidates.size >= limit) break

      const result = await this.questionRepository.findAllWithPagination(
        {
          page: 1,
          limit,
          sortBy: 'updatedAt',
          sortOrder: SortOrder.DESC,
        },
        {
          ...filter,
          excludeQuestionIds: Array.from(excludedIds),
        },
      )

      for (const question of result.questions) {
        if (candidates.size >= limit) break
        if (excludedIds.has(question.questionId)) continue

        candidates.set(question.questionId, question)
        excludedIds.add(question.questionId)
      }
    }

    return Array.from(candidates.values())
  }

  private applyRelatedScore(
    questions: QuestionResponseDto[],
    profile: {
      subjectId?: number
      difficulty?: Difficulty
      grade?: number
      chapterIds: number[]
    },
  ) {
    const baseChapterSet = new Set(profile.chapterIds)

    for (const question of questions) {
      const candidateChapterSet = new Set((question.questionChapters ?? []).map((item) => item.chapterId))
      const overlapCount = Array.from(candidateChapterSet).filter((id) => baseChapterSet.has(id)).length

      let score = 0

      if (profile.subjectId && question.subjectId === profile.subjectId) score += 30
      if (profile.difficulty && question.difficulty === profile.difficulty) score += 25
      if (profile.grade && question.grade === profile.grade) score += 15
      score += overlapCount * 10

      question.relevanceScore = score
    }
  }

  private async processQuestionContents(questions: QuestionResponseDto[], expirySeconds: number) {
    for (const dto of questions) {
      const contentFields: ContentField[] = [{ fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: dto.content }]

      if (dto.solution) {
        contentFields.push({ fieldName: QUESTION_CONTENT_FIELDS.SOLUTION, content: dto.solution })
      }

      if (dto.statements) {
        dto.statements.forEach((stmt, index) => {
          contentFields.push({
            fieldName: `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
            content: stmt.content,
          })
        })
      }

      const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)

      dto.processedContent = this.processContentAndRenderHtmlUseCase.getProcessedContent(
        processedResults,
        QUESTION_CONTENT_FIELDS.CONTENT,
      ) || dto.content

      if (dto.solution) {
        dto.processedSolution = this.processContentAndRenderHtmlUseCase.getProcessedContent(
          processedResults,
          QUESTION_CONTENT_FIELDS.SOLUTION,
        ) || dto.solution
      }

      if (dto.statements) {
        dto.statements.forEach((stmt, index) => {
          stmt.processedContent =
            this.processContentAndRenderHtmlUseCase.getProcessedContent(
              processedResults,
              `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
            ) || stmt.content
        })
      }
    }
  }
}
