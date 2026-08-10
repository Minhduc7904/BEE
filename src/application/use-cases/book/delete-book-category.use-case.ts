import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'
import { BusinessLogicException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteBookCategoryUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(bookCategoryId: number, adminId: number): Promise<BaseResponseDto<{ deleted: true }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const category = await repos.bookCategoryRepository.findById(bookCategoryId)
      if (!category) {
        throw new NotFoundException('Không tìm thấy loại sách')
      }
      if (await repos.bookCategoryRepository.countBooks(bookCategoryId)) {
        throw new BusinessLogicException('Không thể xóa loại sách đang được sử dụng')
      }
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
