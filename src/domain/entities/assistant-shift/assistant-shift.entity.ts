/**
 * Một ca trợ giảng cụ thể, có thể thuộc một lớp hoặc là ca vận hành độc lập.
 */
export class AssistantShift {
  assistantShiftId: number
  name: string
  startAt: Date
  endAt: Date
  requiredAssistantCount: number
  assistantShiftSeriesId: number
  isLocked: boolean
  selfRegistrationOpenAt: Date | null
  selfRegistrationCloseAt: Date | null
  createdAt: Date
  updatedAt: Date
  classId?: number | null
  notes?: string | null
  series?: AssistantShiftSeries
  assignments?: AssistantShiftAssignment[]
  courseClass?: CourseClass

  constructor(data: {
    assistantShiftId: number
    name: string
    startAt: Date
    endAt: Date
    assistantShiftSeriesId: number
    requiredAssistantCount?: number
    isLocked?: boolean
    selfRegistrationOpenAt?: Date | null
    selfRegistrationCloseAt?: Date | null
    createdAt?: Date
    updatedAt?: Date
    classId?: number | null
    notes?: string | null
    series?: AssistantShiftSeries
    assignments?: AssistantShiftAssignment[]
    courseClass?: CourseClass
  }) {
    this.assistantShiftId = data.assistantShiftId
    this.name = data.name
    this.startAt = data.startAt
    this.endAt = data.endAt
    this.assistantShiftSeriesId = data.assistantShiftSeriesId
    this.requiredAssistantCount = data.requiredAssistantCount ?? 1
    this.isLocked = data.isLocked ?? false
    this.selfRegistrationOpenAt = data.selfRegistrationOpenAt ?? null
    this.selfRegistrationCloseAt = data.selfRegistrationCloseAt ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
    this.classId = data.classId ?? null
    this.notes = data.notes ?? null
    this.series = data.series
    this.assignments = data.assignments
    this.courseClass = data.courseClass
  }

  isValidTimeRange(): boolean {
    return this.endAt > this.startAt
  }

  equals(other: AssistantShift): boolean {
    return this.assistantShiftId === other.assistantShiftId
  }
}
import { AssistantShiftAssignment } from './assistant-shift-assignment.entity'
import { AssistantShiftSeries } from './assistant-shift-series.entity'
import { CourseClass } from '../course-class/course-class.entity'
