import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookSalesContactResponseDto, UpdateBookSalesContactDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums'

@Injectable()
export class GetBookSalesContactConfigurationUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(): Promise<BaseResponseDto<BookSalesContactResponseDto>> {
    const configuration = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bookSalesContactConfigurationRepository.findCurrent(),
    )
    if (!configuration) throw new NotFoundException('Chưa cấu hình liên hệ bán sách')
    return BaseResponseDto.success(
      'Lấy cấu hình liên hệ bán sách thành công',
      BookSalesContactResponseDto.fromEntity(configuration),
    )
  }
}

@Injectable()
export class UpdateBookSalesContactConfigurationUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: UpdateBookSalesContactDto,
    adminId: number,
  ): Promise<BaseResponseDto<BookSalesContactResponseDto>> {
    const configuration = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.bookSalesContactConfigurationRepository.findCurrent()
      const updated = await repos.bookSalesContactConfigurationRepository.upsertCurrent(dto)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK_SALES_CONTACT_CONFIGURATION.UPDATE,
        resourceType: RESOURCE_TYPES.BOOK_SALES_CONTACT_CONFIGURATION,
        resourceId: String(updated.bookSalesContactConfigurationId),
        status: AuditStatus.SUCCESS,
        beforeData: current ? { phone: current.phone, facebookUrl: current.facebookUrl } : null,
        afterData: { phone: updated.phone, facebookUrl: updated.facebookUrl },
      })
      return updated
    })
    return BaseResponseDto.success(
      'Cập nhật cấu hình liên hệ bán sách thành công',
      BookSalesContactResponseDto.fromEntity(configuration),
    )
  }
}
