import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookResponseDto, UpdateBookDto } from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'
import { attachBookMedia, syncBookMedia } from './book-media.helper'
import { resolveBookSlug, validateBookInput } from './book-validation.helper'

@Injectable()
export class UpdateBookUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(bookId: number, dto: UpdateBookDto, adminId: number): Promise<BaseResponseDto<BookResponseDto>> {
    const updated = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.bookRepository.findById(bookId, { includeCategories: true })
      if (!current) {
        throw new NotFoundException('Không tìm thấy sách')
      }
      await validateBookInput(
        repos,
        dto,
        bookId,
        current.visibility,
        current.categories?.map((category) => category.bookCategoryId),
      )
      const {
        coverMediaId: _coverMediaId,
        ogImageMediaId: _ogImageMediaId,
        galleryMediaIds: _galleryMediaIds,
        ...bookData
      } = dto
      const data = {
        ...bookData,
        ...(dto.slug === undefined ? {} : { slug: await resolveBookSlug(repos, dto.slug, dto.slug, bookId) }),
      }
      const book = await repos.bookRepository.update(bookId, data)
      await syncBookMedia(repos, bookId, dto, adminId)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK.UPDATE,
        resourceType: RESOURCE_TYPES.BOOK,
        resourceId: String(bookId),
        status: AuditStatus.SUCCESS,
        beforeData: { sku: current.sku, title: current.title },
        afterData: { sku: book.sku, title: book.title },
      })
      return book
    })
    const response = BookResponseDto.fromEntity(updated)
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Cập nhật sách thành công', response)
  }
}
