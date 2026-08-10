import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus, Visibility } from 'src/shared/enums'
import { BusinessLogicException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteBookUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(bookId: number, adminId: number): Promise<BaseResponseDto<{ deleted: true }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.bookRepository.findById(bookId)
      if (!current) {
        throw new NotFoundException('Không tìm thấy sách')
      }
      if (current.visibility !== Visibility.DRAFT) {
        throw new BusinessLogicException('Chỉ được xóa sách ở trạng thái nháp')
      }
      await repos.mediaUsageRepository.detachByEntity(EntityType.BOOK, bookId)
      await repos.bookRepository.delete(bookId)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK.DELETE,
        resourceType: RESOURCE_TYPES.BOOK,
        resourceId: String(bookId),
        status: AuditStatus.SUCCESS,
        beforeData: { sku: current.sku, title: current.title },
      })
    })
    return BaseResponseDto.success('Xóa sách thành công', { deleted: true })
  }
}
