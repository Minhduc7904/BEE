import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, NewsArticleResponseDto } from 'src/application/dtos'
import type { INewsArticleRepository, IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/application/interfaces'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { attachNewsArticleMediaUrls } from './news-article-media.util'

@Injectable()
export class GetNewsArticleByIdUseCase {
  constructor(
    @Inject('INewsArticleRepository') private readonly newsArticleRepository: INewsArticleRepository,
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(newsArticleId: number): Promise<BaseResponseDto<NewsArticleResponseDto>> {
    const newsArticle = await this.newsArticleRepository.findById(newsArticleId)
    if (!newsArticle) throw new NotFoundException('Khong tim thay bai viet tin tuc')

    const response = NewsArticleResponseDto.fromEntity(newsArticle)
    await attachNewsArticleMediaUrls(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Lay chi tiet bai viet tin tuc thanh cong', response)
  }
}
