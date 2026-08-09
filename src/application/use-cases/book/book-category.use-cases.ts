import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookCategoryDto, CreateBookCategoryDto, UpdateBookCategoryDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'
import { BusinessLogicException, ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { slugifyBook } from './book.util'

@Injectable()
export class CreateBookCategoryUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(dto: CreateBookCategoryDto, adminId: number): Promise<BaseResponseDto<BookCategoryDto>> {
    const category = await this.unitOfWork.executeInTransaction(async (repos) => {
      const slug = dto.slug ? slugifyBook(dto.slug) : slugifyBook(dto.name)
      if (await repos.bookCategoryRepository.findBySlug(slug)) throw new ConflictException('Slug loại sách đã tồn tại')
      const created = await repos.bookCategoryRepository.create({ ...dto, slug })
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK_CATEGORY.CREATE,
        resourceType: RESOURCE_TYPES.BOOK_CATEGORY,
        resourceId: String(created.bookCategoryId),
        status: AuditStatus.SUCCESS,
        afterData: { name: created.name, slug: created.slug },
      })
      return created
    })
    return BaseResponseDto.success('Tạo loại sách thành công', BookCategoryDto.fromEntity(category))
  }
}

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
      if (!current) throw new NotFoundException('Không tìm thấy loại sách')
      const slug = dto.slug === undefined ? undefined : slugifyBook(dto.slug)
      if (slug) {
        const existing = await repos.bookCategoryRepository.findBySlug(slug)
        if (existing && existing.bookCategoryId !== bookCategoryId)
          throw new ConflictException('Slug loại sách đã tồn tại')
      }
      const updated = await repos.bookCategoryRepository.update(bookCategoryId, { ...dto, ...(slug ? { slug } : {}) })
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

@Injectable()
export class DeleteBookCategoryUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(bookCategoryId: number, adminId: number): Promise<BaseResponseDto<{ deleted: true }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const category = await repos.bookCategoryRepository.findById(bookCategoryId)
      if (!category) throw new NotFoundException('Không tìm thấy loại sách')
      if (await repos.bookCategoryRepository.countBooks(bookCategoryId))
        throw new BusinessLogicException('Không thể xóa loại sách đang được sử dụng')
      await repos.bookCategoryRepository.delete(bookCategoryId)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK_CATEGORY.DELETE,
        resourceType: RESOURCE_TYPES.BOOK_CATEGORY,
        resourceId: String(bookCategoryId),
        status: AuditStatus.SUCCESS,
        beforeData: { name: category.name },
      })
    })
    return BaseResponseDto.success('Xóa loại sách thành công', { deleted: true })
  }
}

@Injectable()
export class GetBookCategoriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(isActive?: boolean): Promise<BaseResponseDto<BookCategoryDto[]>> {
    const categories = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bookCategoryRepository.findAll({ isActive }),
    )
    return BaseResponseDto.success('Lấy danh sách loại sách thành công', BookCategoryDto.fromEntityList(categories))
  }
}
