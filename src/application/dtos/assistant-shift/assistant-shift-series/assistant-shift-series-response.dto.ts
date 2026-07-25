import { AssistantShiftSeries } from '../../../../domain/entities/assistant-shift'

export class AssistantShiftSeriesResponseDto {
  assistantShiftSeriesId: number
  name: string
  isLocked: boolean

  constructor(entity: AssistantShiftSeries) {
    this.assistantShiftSeriesId = entity.assistantShiftSeriesId
    this.name = entity.name
    this.isLocked = entity.isLocked
  }
}
