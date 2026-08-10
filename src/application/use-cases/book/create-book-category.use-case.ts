import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, BookCategoryDto, CreateBookCategoryDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { slugifyBook } from './book.util'

@Injectable()
export class CreateBookCategoryUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(dto: CreateBookCategoryDto, adminId: number): Promise<BaseResponseDto<BookCategoryDto>> {
    const category = await this.unitOfWork.executeInTransaction(async (repos) => {
      const slug = dto.slug ? slugifyBook(dto.slug) : slugifyBook(dto.name)
      if (await repos.bookCategoryRepository.findBySlug(slug)) {
        throw new ConflictException('Slug loại sách đã tồn tại')
      }
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
