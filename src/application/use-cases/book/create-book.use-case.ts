import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, BookResponseDto, CreateBookDto } from 'src/application/dtos'
import { BookSeoAiService, MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'
import { attachBookMedia, syncBookMedia } from './book-media.helper'
import { resolveBookSlug, validateBookInput } from './book-validation.helper'

@Injectable()
export class CreateBookUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
    private readonly bookSeoAiService: BookSeoAiService,
  ) {}

  async execute(dto: CreateBookDto, adminId: number): Promise<BaseResponseDto<BookResponseDto>> {
    const generatedSeo = dto.autoGenerateSeo
      ? await this.bookSeoAiService.generate({
          title: dto.title,
          shortDescription: dto.shortDescription,
          content: dto.content,
          author: dto.author,
          publisher: dto.publisher,
          priceVnd: dto.priceVnd,
        })
      : undefined
    const created = await this.unitOfWork.executeInTransaction(async (repos) => {
      await validateBookInput(repos, dto)
      const {
        autoGenerateSeo: _autoGenerateSeo,
        coverMediaId: _coverMediaId,
        ogImageMediaId: _ogImageMediaId,
        galleryMediaIds: _galleryMediaIds,
        ...bookData
      } = dto
      const book = await repos.bookRepository.create({
        ...bookData,
        targetKeyword: dto.targetKeyword || generatedSeo?.targetKeyword,
        keywordText: dto.keywordText || generatedSeo?.keywordText,
        metaTitle: dto.metaTitle || generatedSeo?.metaTitle,
        metaDescription: dto.metaDescription || generatedSeo?.metaDescription,
        ogTitle: dto.ogTitle || generatedSeo?.ogTitle,
        ogDescription: dto.ogDescription || generatedSeo?.ogDescription,
        searchIntent: dto.searchIntent || generatedSeo?.searchIntent,
        seoScore: dto.seoScore ?? generatedSeo?.seoScore,
        structuredData: dto.structuredData ?? generatedSeo?.structuredData,
        slug: await resolveBookSlug(repos, dto.slug, dto.title),
      })
      await syncBookMedia(repos, book.bookId, dto, adminId)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK.CREATE,
        resourceType: RESOURCE_TYPES.BOOK,
        resourceId: String(book.bookId),
        status: AuditStatus.SUCCESS,
        afterData: { sku: book.sku, title: book.title, autoGenerateSeo: Boolean(dto.autoGenerateSeo) },
      })
      return book
    })
    const response = BookResponseDto.fromEntity(created)
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Tạo sách thành công', response)
  }
}
