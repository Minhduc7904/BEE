import { IsRequiredIdNumber } from '../../../../shared/decorators/validate'

export class CreateAssistantShiftTransferRequestDto {
  @IsRequiredIdNumber('ID ca muốn nhường')
  assistantShiftId!: number

  @IsRequiredIdNumber('ID trợ giảng nhận ca')
  targetAdminId!: number
}
