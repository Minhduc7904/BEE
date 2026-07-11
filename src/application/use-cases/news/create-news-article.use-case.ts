import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, CreateNewsArticleDto, NewsArticleResponseDto } from 'src/application/dtos'
import type { INewsArticleRepository, IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { NewsArticleSeoAiService } from 'src/infrastructure/services/news-article-seo-ai.service'
import { attachNewsArticleMediaUrls, extractTiptapPlainText, normalizeTiptapContentForStorage, syncNewsArticleContentMediaUsages, syncNewsArticleThumbnailUsage } from './news-article-media.util'
import { generateUniqueNewsArticleSlug } from './news-article-slug.util'

@Injectable()
export class CreateNewsArticleUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('INewsArticleRepository') private readonly newsArticleRepository: INewsArticleRepository,
    private readonly minioService: MinioService,
    private readonly newsArticleSeoAiService: NewsArticleSeoAiService,
  ) {}

  async execute(dto: CreateNewsArticleDto, userId?: number): Promise<BaseResponseDto<NewsArticleResponseDto>> {
    const normalizedContentJson = normalizeTiptapContentForStorage(dto.contentJson)
    const contentText = extractTiptapPlainText(normalizedContentJson) || dto.contentText || ''
    const seoFields = this.shouldGenerateSeo(dto)
      ? await this.newsArticleSeoAiService.generate({
          type: dto.type,
          title: dto.title,
          excerpt: dto.excerpt,
          contentText,
        })
      : null

    const newsArticle = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { auto, thumbnailMediaId, publishedAt, contentJson, contentText: _, ...data } = dto
      const slug = await generateUniqueNewsArticleSlug(dto.title, repos.newsArticleRepository)
      const created = await repos.newsArticleRepository.create({
        ...data,
        slug,
        contentJson: normalizedContentJson,
        contentText,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        targetKeyword: dto.targetKeyword || seoFields?.targetKeyword,
        keywordText: dto.keywordText || seoFields?.keywordText,
        metaTitle: dto.metaTitle || seoFields?.metaTitle,
        metaDescription: dto.metaDescription || seoFields?.metaDescription,
        ogTitle: dto.ogTitle || seoFields?.ogTitle,
        ogDescription: dto.ogDescription || seoFields?.ogDescription,
        searchIntent: dto.searchIntent || seoFields?.searchIntent,
        seoScore: dto.seoScore ?? seoFields?.seoScore,
        readingTime: dto.readingTime ?? seoFields?.readingTime,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })

      await syncNewsArticleContentMediaUsages(repos, created.newsArticleId, normalizedContentJson, userId)
      if (thumbnailMediaId !== undefined) {
        await syncNewsArticleThumbnailUsage(repos, created.newsArticleId, thumbnailMediaId ?? null, userId)
      }

      return created
    })

    const response = NewsArticleResponseDto.fromEntity(newsArticle)
    await attachNewsArticleMediaUrls(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Tao bai viet tin tuc thanh cong', response)
  }

  private shouldGenerateSeo(dto: CreateNewsArticleDto): boolean {
    if (dto.auto === false) return false

    return (
      !dto.targetKeyword || !dto.keywordText || !dto.metaTitle || !dto.metaDescription ||
      !dto.ogTitle || !dto.ogDescription || !dto.searchIntent || dto.seoScore === undefined ||
      dto.readingTime === undefined
    )
  }
}
