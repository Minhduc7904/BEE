import { IsRequiredIntArray } from '../../../../shared/decorators/validate'

export class AssistantShiftSeriesIdsDto {
  @IsRequiredIntArray('Danh sách ID chuỗi ca')
  assistantShiftSeriesIds!: number[]
}
