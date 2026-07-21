import { TuitionCollectionConfiguration } from '../../../domain/entities/tuition-online-payment'
import { TuitionCollectionMode } from '../../../shared/enums'
import {
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsRequiredString,
} from '../../../shared/decorators/validate'

export class UpdateTuitionCollectionConfigurationDto {
  @IsOptionalEnumValue(TuitionCollectionMode, 'Chế độ thu học phí')
  collectionMode?: TuitionCollectionMode

  @IsOptionalIdNumber('ID tài khoản nhận tiền thủ công mặc định')
  defaultManualReceivingBankAccountId?: number

  @IsRequiredString('Lý do thay đổi cấu hình', 500, 3)
  reason: string
}

export class TuitionCollectionConfigurationResponseDto {
  tuitionCollectionConfigurationId: number
  collectionMode: TuitionCollectionMode
  defaultManualReceivingBankAccountId: number
  createdAt: Date
  updatedAt: Date

  static fromTuitionCollectionConfiguration(
    configuration: TuitionCollectionConfiguration,
  ): TuitionCollectionConfigurationResponseDto {
    return {
      tuitionCollectionConfigurationId: configuration.tuitionCollectionConfigurationId,
      collectionMode: configuration.collectionMode,
      defaultManualReceivingBankAccountId: configuration.defaultManualReceivingBankAccountId,
      createdAt: configuration.createdAt,
      updatedAt: configuration.updatedAt,
    }
  }
}
