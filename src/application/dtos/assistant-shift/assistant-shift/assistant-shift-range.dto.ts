import { IsRequiredDate } from '../../../../shared/decorators/validate'

export class AssistantShiftRangeDto {
  @IsRequiredDate('Thời gian bắt đầu')
  startAt!: string

  @IsRequiredDate('Thời gian kết thúc')
  endAt!: string
}
