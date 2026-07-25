import { IsOptionalBoolean, IsRequiredDate } from '../../../../shared/decorators/validate'

export class CopyBaseAssistantShiftsDto {
  @IsRequiredDate('Thời gian bắt đầu dán')
  startPasteAt!: string

  @IsRequiredDate('Thời gian kết thúc dán')
  endPasteAt!: string

  @IsOptionalBoolean('Sao chép phân công trợ giảng')
  copyAssignments?: boolean
}
