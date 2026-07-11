import { Injectable } from '@nestjs/common'
import { NewsArticleListQueryDto, NewsArticleResponseDto, PaginationResponseDto } from 'src/application/dtos'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { GetNewsArticlesUseCase } from './get-news-articles.use-case'

@Injectable()
export class GetPublicSeoLatestNewsArticlesUseCase {
  constructor(private readonly getNewsArticlesUseCase: GetNewsArticlesUseCase) {}

  async execute(query: NewsArticleListQueryDto): Promise<PaginationResponseDto<NewsArticleResponseDto>> {
    query.visibility = Visibility.PUBLISHED
    query.sortBy = 'publishedAt'
    query.sortOrder = SortOrder.DESC
    return this.getNewsArticlesUseCase.execute(query)
  }
}
