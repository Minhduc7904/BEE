import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookCategoryDto, UpdateBookCategoryDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { slugifyBook } from './book.util'

@Injectable()
export class UpdateBookCategoryUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    bookCategoryId: number,
    dto: UpdateBookCategoryDto,
    adminId: number,
  ): Promise<BaseResponseDto<BookCategoryDto>> {
    const category = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.bookCategoryRepository.findById(bookCategoryId)
      if (!current) {
        throw new NotFoundException('Không tìm thấy loại sách')
      }
      const slug = dto.slug === undefined ? undefined : slugifyBook(dto.slug)
      if (slug) {
        const existing = await repos.bookCategoryRepository.findBySlug(slug)
        if (existing && existing.bookCategoryId !== bookCategoryId) {
          throw new ConflictException('Slug loại sách đã tồn tại')
        }
      }
      const updated = await repos.bookCategoryRepository.update(bookCategoryId, {
        ...dto,
        ...(slug ? { slug } : {}),
      })
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK_CATEGORY.UPDATE,
        resourceType: RESOURCE_TYPES.BOOK_CATEGORY,
        resourceId: String(bookCategoryId),
        status: AuditStatus.SUCCESS,
        beforeData: { name: current.name },
        afterData: { name: updated.name, isActive: updated.isActive },
      })
      return updated
    })
    return BaseResponseDto.success('Cập nhật loại sách thành công', BookCategoryDto.fromEntity(category))
  }
}
