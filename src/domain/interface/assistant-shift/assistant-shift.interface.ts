import { AssistantShiftAssignmentAttendanceStatus } from '../../../shared/enums'

export interface OffsetPaginationOptions {
  skip?: number
  take?: number
}

export interface CreateAssistantShiftData {
  assistantShiftSeriesId: number
  name: string
  startAt: Date
  endAt: Date
  requiredAssistantCount?: number
  classId?: number | null
  notes?: string | null
  isLocked?: boolean
  selfRegistrationOpenAt?: Date | null
  selfRegistrationCloseAt?: Date | null
}

export interface UpdateAssistantShiftData {
  name?: string
  startAt?: Date
  endAt?: Date
  requiredAssistantCount?: number
  assistantShiftSeriesId?: number
  classId?: number | null
  notes?: string | null
  isLocked?: boolean
  selfRegistrationOpenAt?: Date | null
  selfRegistrationCloseAt?: Date | null
}

export interface AssistantShiftRelationOptions {
  includeSeries?: boolean
  includeAssignmentsWithAdmin?: boolean
  includeAssignmentsForAdminId?: number
  includeCourseClass?: boolean
}

export interface AssistantShiftListOptions extends OffsetPaginationOptions, AssistantShiftRelationOptions {
  assistantShiftSeriesId?: number
  classId?: number | null
  startAtFrom?: Date
  startAtTo?: Date
  onlyUnlocked?: boolean
  assignedAdminId?: number
}

export interface CreateAssistantShiftAssignmentData {
  assistantShiftId: number
  adminId: number
  attendanceStatus?: AssistantShiftAssignmentAttendanceStatus
  absenceReason?: string | null
  managerNote?: string | null
}

export interface UpdateAssistantShiftAssignmentData {
  attendanceStatus?: AssistantShiftAssignmentAttendanceStatus
  absenceReason?: string | null
  managerNote?: string | null
}

export interface AssistantShiftAssignmentListOptions extends OffsetPaginationOptions {
  assistantShiftId?: number
  adminId?: number
  attendanceStatus?: AssistantShiftAssignmentAttendanceStatus
}

export interface AssistantShiftReminderCandidate {
  assistantShiftId: number
  adminId: number
  token?: string | null
  assistantShiftName: string
  startAt: Date
  endAt: Date
  recipientEmail: string
  recipientName: string
  attendanceStatus: AssistantShiftAssignmentAttendanceStatus
}
