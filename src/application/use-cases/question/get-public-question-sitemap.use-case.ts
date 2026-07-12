import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories/question.repository'
import {
  QuestionSitemapQueryDto,
  QuestionSitemapResponseDto,
} from '../../dtos/question'
import { SortOrder } from '../../../shared/enums/sort-order.enum'

@Injectable()
export class GetPublicQuestionSitemapUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(query: QuestionSitemapQueryDto): Promise<QuestionSitemapResponseDto> {
    const page = query.page ?? 1
    const limit = query.limit ?? 1000
    const result = await this.questionRepository.findSitemapEntriesExcludingDraft({
      page,
      limit,
      sortBy: 'updatedAt',
      sortOrder: query.sortOrder ?? SortOrder.DESC,
    })

    return {
      success: true,
      data: result.entries,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasPrevious: result.page > 1,
        hasNext: result.page < result.totalPages,
      },
    }
  }
}
