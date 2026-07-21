import { Inject, Injectable } from '@nestjs/common'

import {
  BaseResponseDto,
  TuitionCollectionConfigurationResponseDto,
  UpdateTuitionCollectionConfigurationDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus, ReceivingBankAccountStatus } from '../../../shared/enums'
import { TuitionCollectionConfiguration } from '../../../domain/entities/tuition-online-payment'

@Injectable()
export class UpdateTuitionCollectionConfigurationUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: UpdateTuitionCollectionConfigurationDto,
    adminId: number,
  ): Promise<BaseResponseDto<TuitionCollectionConfigurationResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const configuration = await repos.tuitionCollectionConfigurationRepository.findCurrent()
      if (!configuration) {
        throw new NotFoundException(
          'Chưa có cấu hình thu học phí. Hãy khởi tạo cấu hình trước khi sử dụng.',
        )
      }

      const defaultManualReceivingBankAccountId =
        dto.defaultManualReceivingBankAccountId ?? configuration.defaultManualReceivingBankAccountId
      const defaultBank = await repos.receivingBankAccountRepository.findById(
        defaultManualReceivingBankAccountId,
      )

      if (!defaultBank) {
        throw new NotFoundException(
          `Không tìm thấy tài khoản nhận tiền mặc định với ID ${defaultManualReceivingBankAccountId}`,
        )
      }

      if (defaultBank.status !== ReceivingBankAccountStatus.ACTIVE) {
        throw new ConflictException('Tài khoản nhận tiền mặc định phải ở trạng thái ACTIVE')
      }

      const hasChanges =
        (dto.collectionMode !== undefined && dto.collectionMode !== configuration.collectionMode) ||
        defaultManualReceivingBankAccountId !== configuration.defaultManualReceivingBankAccountId

      if (!hasChanges) {
        return TuitionCollectionConfigurationResponseDto.fromTuitionCollectionConfiguration(configuration)
      }

      const beforeData = this.toAuditData(configuration)
      const updated = await repos.tuitionCollectionConfigurationRepository.update(
        configuration.tuitionCollectionConfigurationId,
        {
          collectionMode: dto.collectionMode,
          defaultManualReceivingBankAccountId: dto.defaultManualReceivingBankAccountId,
        },
      )
      const result = TuitionCollectionConfigurationResponseDto.fromTuitionCollectionConfiguration(updated)

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.TUITION_COLLECTION_CONFIGURATION.UPDATE,
        resourceType: RESOURCE_TYPES.TUITION_COLLECTION_CONFIGURATION,
        resourceId: String(updated.tuitionCollectionConfigurationId),
        status: AuditStatus.SUCCESS,
        beforeData,
        afterData: {
          ...this.toAuditData(updated),
          reason: dto.reason,
        },
      })

      return result
    })

    return BaseResponseDto.success('Cập nhật cấu hình thu học phí thành công', response)
  }

  private toAuditData(configuration: TuitionCollectionConfiguration) {
    return {
      tuitionCollectionConfigurationId: configuration.tuitionCollectionConfigurationId,
      collectionMode: configuration.collectionMode,
      defaultManualReceivingBankAccountId: configuration.defaultManualReceivingBankAccountId,
    }
  }
}
