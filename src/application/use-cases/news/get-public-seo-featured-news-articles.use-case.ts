import { Injectable } from '@nestjs/common'
import { NewsArticleListQueryDto, NewsArticleResponseDto, PaginationResponseDto } from 'src/application/dtos'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { GetNewsArticlesUseCase } from './get-news-articles.use-case'

@Injectable()
export class GetPublicSeoFeaturedNewsArticlesUseCase {
  constructor(private readonly getNewsArticlesUseCase: GetNewsArticlesUseCase) {}

  async execute(query: NewsArticleListQueryDto): Promise<PaginationResponseDto<NewsArticleResponseDto>> {
    query.visibility = Visibility.PUBLISHED
    query.isFeatured = true
    if (!query.sortBy) {
      query.sortBy = 'sortOrder'
      query.sortOrder = SortOrder.ASC
    }
    return this.getNewsArticlesUseCase.execute(query)
  }
}
