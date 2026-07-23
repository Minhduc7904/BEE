import { AssistantShiftSeries } from '../entities/assistant-shift'

export interface IAssistantShiftSeriesRepository {
  create(data: { name: string; isLocked?: boolean }): Promise<AssistantShiftSeries>
  findById(assistantShiftSeriesId: number): Promise<AssistantShiftSeries | null>
  findAll(options?: { skip?: number; take?: number; isLocked?: boolean }): Promise<AssistantShiftSeries[]>
  update(assistantShiftSeriesId: number, data: { name?: string; isLocked?: boolean }): Promise<AssistantShiftSeries>
  delete(assistantShiftSeriesId: number): Promise<boolean>
}
