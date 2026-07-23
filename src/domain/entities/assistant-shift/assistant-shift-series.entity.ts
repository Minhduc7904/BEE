/**
 * Nhóm các ca trợ giảng có liên quan theo chuỗi, ví dụ các ca lặp theo tuần.
 */
export class AssistantShiftSeries {
  assistantShiftSeriesId: number
  name: string
  isLocked: boolean
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    assistantShiftSeriesId: number
    name: string
    isLocked?: boolean
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.assistantShiftSeriesId = data.assistantShiftSeriesId
    this.name = data.name
    this.isLocked = data.isLocked ?? false
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  equals(other: AssistantShiftSeries): boolean {
    return this.assistantShiftSeriesId === other.assistantShiftSeriesId
  }
}
