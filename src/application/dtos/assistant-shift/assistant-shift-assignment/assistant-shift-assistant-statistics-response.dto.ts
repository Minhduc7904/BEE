import { AssistantShiftAssistantStatisticsItemDto } from './assistant-shift-assistant-statistics-item.dto'

export class AssistantShiftAssistantStatisticsResponseDto {
  startAt: Date
  endAt: Date
  assistants: AssistantShiftAssistantStatisticsItemDto[]
}
