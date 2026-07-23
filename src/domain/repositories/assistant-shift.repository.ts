import { AssistantShift } from '../entities/assistant-shift'
import {
  AssistantShiftListOptions,
  AssistantShiftRelationOptions,
  CreateAssistantShiftData,
  UpdateAssistantShiftData,
} from '../interface/assistant-shift'

export interface IAssistantShiftRepository {
  create(data: CreateAssistantShiftData): Promise<AssistantShift>
  findById(assistantShiftId: number, options?: AssistantShiftRelationOptions): Promise<AssistantShift | null>
  findAll(options?: AssistantShiftListOptions): Promise<AssistantShift[]>
  hasOverlappingTimeRange(assistantShiftSeriesId: number, startAt: Date, endAt: Date): Promise<boolean>
  updateBySeriesAndStartAtRange(
    assistantShiftSeriesId: number,
    startAt: Date,
    endAt: Date,
    data: UpdateAssistantShiftData,
  ): Promise<number>
  update(assistantShiftId: number, data: UpdateAssistantShiftData): Promise<AssistantShift>
  delete(assistantShiftId: number): Promise<boolean>
}
