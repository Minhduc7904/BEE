import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookResponseDto, UpdateBookMediaDto } from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'
import { ValidationException } from 'src/shared/exceptions/custom-exceptions'
import { attachBookMedia, syncBookMedia } from './book-media.helper'

@Injectable()
export class UpdateBookMediaUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(bookId: number, dto: UpdateBookMediaDto, adminId: number): Promise<BaseResponseDto<BookResponseDto>> {
    this.ensureMediaChangeRequested(dto)

    const book = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.bookRepository.findById(bookId, { includeCategories: true })
      if (!current) {
        throw new NotFoundException('Không tìm thấy sách')
      }

      await syncBookMedia(repos, bookId, dto, adminId)
      const updated = await repos.bookRepository.update(bookId, {})

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK.UPDATE,
        resourceType: RESOURCE_TYPES.BOOK,
        resourceId: String(bookId),
        status: AuditStatus.SUCCESS,
        beforeData: { sku: current.sku, title: current.title, mediaUpdated: false },
        afterData: { sku: updated.sku, title: updated.title, mediaUpdated: true },
      })

      return updated
    })

    const response = BookResponseDto.fromEntity(book)
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Cập nhật media sách thành công', response)
  }

  private ensureMediaChangeRequested(dto: UpdateBookMediaDto): void {
    if (dto.coverMediaId === undefined && dto.ogImageMediaId === undefined && dto.galleryMediaIds === undefined) {
      throw new ValidationException('Cần truyền ít nhất một nhóm media để cập nhật sách')
    }
  }
}
