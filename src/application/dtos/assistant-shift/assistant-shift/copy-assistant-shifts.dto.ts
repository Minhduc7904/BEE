import { IsOptionalBoolean, IsRequiredDate } from '../../../../shared/decorators/validate'

export class CopyAssistantShiftsDto {
  @IsRequiredDate('Thời gian bắt đầu sao chép')
  startCopyAt!: string

  @IsRequiredDate('Thời gian kết thúc sao chép')
  endCopyAt!: string

  @IsRequiredDate('Thời gian bắt đầu dán')
  startPasteAt!: string

  @IsRequiredDate('Thời gian kết thúc dán')
  endPasteAt!: string

  @IsOptionalBoolean('Sao chép phân công trợ giảng')
  copyAssignments?: boolean
}
