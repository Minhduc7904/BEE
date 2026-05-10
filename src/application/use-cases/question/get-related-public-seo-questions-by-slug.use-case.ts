// src/application/use-cases/question/get-related-public-seo-questions-by-slug.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository, QuestionFilterOptions } from '../../../domain/repositories'
import { Question } from '../../../domain/entities/exam/question.entity'
import { QuestionListResponseDto, QuestionResponseDto } from '../../dtos/question/question.dto'
import { PublicStudentRelatedQuestionsQueryDto } from '../../dtos/question/public-student-related-questions-query.dto'
import { Visibility } from '../../../shared/enums'
import { SortOrder } from '../../../shared/enums/sort-order.enum'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import type { ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

@Injectable()
export class GetRelatedPublicSeoQuestionsBySlugUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
  ) {}

  async execute(
    slug: string,
    query: PublicStudentRelatedQuestionsQueryDto,
    expirySeconds = 3600,
  ): Promise<QuestionListResponseDto> {
    const baseQuestion = await this.questionRepository.findBySlug(slug)

    if (!baseQuestion || baseQuestion.visibility !== Visibility.PUBLISHED) {
      throw new NotFoundException('Không tìm thấy câu hỏi công khai')
    }

    const limit = query.limit || 10
    const chapterIds = baseQuestion.questionChapters?.map((item) => item.chapterId) ?? []

    const relatedQuestions = await this.findRelatedQuestions(baseQuestion, limit, {
      subjectId: baseQuestion.subjectId ?? undefined,
      grade: baseQuestion.grade ?? undefined,
      chapterIds,
    })

    const questionResponses = QuestionResponseDto.fromEntities(relatedQuestions)

    this.applyRelatedScore(questionResponses, {
      subjectId: baseQuestion.subjectId ?? undefined,
      grade: baseQuestion.grade ?? undefined,
      chapterIds,
      baseContent: baseQuestion.searchableContent || TextSearchUtil.stripMarkdownForSearch(baseQuestion.content || ''),
    })

    questionResponses.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

    await this.processQuestionContents(questionResponses, expirySeconds)

    return new QuestionListResponseDto(questionResponses, 1, limit, questionResponses.length)
  }

  private async findRelatedQuestions(
    baseQuestion: Question,
    limit: number,
    profile: {
      subjectId?: number
      grade?: number
      chapterIds: number[]
    },
  ) {
    const candidates = new Map<number, Question>()
    const excludedIds = new Set<number>([baseQuestion.questionId])
    const fetchLimit = Math.max(limit * 3, 20)

    const strategyFilters: QuestionFilterOptions[] = [
      {
        visibility: Visibility.PUBLISHED,
        subjectId: profile.subjectId,
        grade: profile.grade,
        chapterIds: profile.chapterIds.length ? profile.chapterIds : undefined,
      },
      {
        visibility: Visibility.PUBLISHED,
        subjectId: profile.subjectId,
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
          limit: fetchLimit,
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
      grade?: number
      chapterIds: number[]
      baseContent: string
    },
  ) {
    const baseChapterSet = new Set(profile.chapterIds)
    const baseContent = profile.baseContent || ''

    for (const question of questions) {
      const candidateChapterSet = new Set((question.questionChapters ?? []).map((item) => item.chapterId))
      const overlapCount = Array.from(candidateChapterSet).filter((id) => baseChapterSet.has(id)).length

      let score = 0

      if (profile.subjectId && question.subjectId === profile.subjectId) score += 30
      if (profile.grade && question.grade === profile.grade) score += 15
      score += overlapCount * 10

      if (baseContent) {
        const candidateContent = TextSearchUtil.stripMarkdownForSearch(question.content || '')
        const contentScore = TextSearchUtil.calculateRelevanceScore(candidateContent, baseContent)
        score += Math.round(contentScore * 0.4)
      }

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

      dto.processedContent =
        this.processContentAndRenderHtmlUseCase.getProcessedContent(processedResults, QUESTION_CONTENT_FIELDS.CONTENT) ||
        dto.content

      if (dto.solution) {
        dto.processedSolution =
          this.processContentAndRenderHtmlUseCase.getProcessedContent(processedResults, QUESTION_CONTENT_FIELDS.SOLUTION) ||
          dto.solution
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
