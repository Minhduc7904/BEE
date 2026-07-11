import { Inject, Injectable } from '@nestjs/common'
import { NewsArticleListQueryDto, NewsArticleResponseDto, PaginationResponseDto } from 'src/application/dtos'
import type { INewsArticleRepository, IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { attachNewsArticleMediaUrls } from './news-article-media.util'

@Injectable()
export class GetNewsArticlesUseCase {
  constructor(
    @Inject('INewsArticleRepository') private readonly newsArticleRepository: INewsArticleRepository,
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: NewsArticleListQueryDto): Promise<PaginationResponseDto<NewsArticleResponseDto>> {
    const pagination = query.toNewsArticlePaginationOptions()
    const result = await this.newsArticleRepository.findAllWithPagination({
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      search: query.search,
      type: query.type,
      visibility: query.visibility,
      isFeatured: query.isFeatured,
    })

    const data = NewsArticleResponseDto.fromEntityListItems(result.data)
    await Promise.all(data.map((item) =>
      attachNewsArticleMediaUrls(this.unitOfWork, this.minioService, item, { includeContentMedia: false }),
    ))

    return PaginationResponseDto.success(
      'Lay danh sach bai viet tin tuc thanh cong',
      data,
      pagination.page,
      pagination.limit,
      result.total,
    )
  }
}
