import { IsRequiredIdNumber } from '../../../../shared/decorators/validate'

export class CreateAssistantShiftSwapRequestDto {
  @IsRequiredIdNumber('ID ca của bạn')
  myAssistantShiftId!: number

  @IsRequiredIdNumber('ID ca muốn đổi')
  targetAssistantShiftId!: number

  @IsRequiredIdNumber('ID trợ giảng muốn đổi')
  targetAdminId!: number
}
