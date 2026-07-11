import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, NewsArticleResponseDto, UpdateNewsArticleDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { attachNewsArticleMediaUrls, normalizeTiptapContentForStorage, syncNewsArticleContentMediaUsages, syncNewsArticleThumbnailUsage } from './news-article-media.util'
import { generateUniqueNewsArticleSlug } from './news-article-slug.util'

@Injectable()
export class UpdateNewsArticleUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    newsArticleId: number,
    dto: UpdateNewsArticleDto,
    userId?: number,
  ): Promise<BaseResponseDto<NewsArticleResponseDto>> {
    const newsArticle = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.newsArticleRepository.findById(newsArticleId)
      if (!existing) throw new NotFoundException('Khong tim thay bai viet tin tuc')

      const { thumbnailMediaId, contentJson, publishedAt, ...data } = dto
      const updateData: any = { ...data, updatedBy: userId ?? null }

      if (dto.title) {
        updateData.slug = await generateUniqueNewsArticleSlug(
          dto.title || existing.title,
          repos.newsArticleRepository,
          newsArticleId,
          existing.slug,
        )
      }

      let normalizedContentJson: Record<string, unknown> | undefined
      if (contentJson !== undefined) {
        normalizedContentJson = normalizeTiptapContentForStorage(contentJson)
        updateData.contentJson = normalizedContentJson
      }

      if (publishedAt !== undefined) {
        updateData.publishedAt = publishedAt ? new Date(publishedAt) : null
      }

      const updated = await repos.newsArticleRepository.update(newsArticleId, updateData)

      if (normalizedContentJson) {
        await syncNewsArticleContentMediaUsages(repos, newsArticleId, normalizedContentJson, userId)
      }

      if (thumbnailMediaId !== undefined) {
        await syncNewsArticleThumbnailUsage(repos, newsArticleId, thumbnailMediaId ?? null, userId)
      }

      return updated
    })

    const response = NewsArticleResponseDto.fromEntity(newsArticle)
    await attachNewsArticleMediaUrls(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Cap nhat bai viet tin tuc thanh cong', response)
  }
}
