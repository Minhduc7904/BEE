import { AssistantShift } from '../../../../domain/entities/assistant-shift'
import { CourseClassResponseDto } from '../../course-class/course-class.dto'
import { AssistantShiftAssignmentResponseDto } from '../assistant-shift-assignment/assistant-shift-assignment-response.dto'
import { AssistantShiftSeriesResponseDto } from '../assistant-shift-series/assistant-shift-series-response.dto'

export class AssistantShiftResponseDto {
  assistantShiftId: number
  assistantShiftSeriesId: number
  classId: number | null
  name: string
  notes: string | null
  startAt: Date
  endAt: Date
  isLocked: boolean
  isBaseShift: boolean
  selfRegistrationOpenAt: Date | null
  selfRegistrationCloseAt: Date | null
  requiredAssistantCount: number
  series?: AssistantShiftSeriesResponseDto
  assignments?: AssistantShiftAssignmentResponseDto[]
  courseClass?: CourseClassResponseDto

  constructor(entity: AssistantShift) {
    this.assistantShiftId = entity.assistantShiftId
    this.assistantShiftSeriesId = entity.assistantShiftSeriesId
    this.classId = entity.classId ?? null
    this.name = entity.name
    this.notes = entity.notes ?? null
    this.startAt = entity.startAt
    this.endAt = entity.endAt
    this.isLocked = entity.isLocked
    this.isBaseShift = entity.isBaseShift
    this.selfRegistrationOpenAt = entity.selfRegistrationOpenAt
    this.selfRegistrationCloseAt = entity.selfRegistrationCloseAt
    this.requiredAssistantCount = entity.requiredAssistantCount

    if (entity.series) this.series = new AssistantShiftSeriesResponseDto(entity.series)
    if (entity.assignments) {
      this.assignments = entity.assignments.map((assignment) => new AssistantShiftAssignmentResponseDto(assignment))
    }
    if (entity.courseClass) this.courseClass = new CourseClassResponseDto(entity.courseClass)
  }
}
