import { AssistantShiftAssignment } from '../../../../domain/entities/assistant-shift'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'

export class AssistantShiftAssignmentResponseDto {
  assistantShiftId: number
  adminId: number
  attendanceStatus: AssistantShiftAssignmentAttendanceStatus
  absenceReason: string | null
  managerNote: string | null
  isPendingExchangeRequest?: boolean
  nextExchangeRequestAllowedAt?: Date | null
  admin?: {
    adminId: number
    userId: number
    fullName: string
    avatarUrl?: string
  }

  constructor(entity: AssistantShiftAssignment) {
    this.assistantShiftId = entity.assistantShiftId
    this.adminId = entity.adminId
    this.attendanceStatus = entity.attendanceStatus
    this.absenceReason = entity.absenceReason ?? null
    this.managerNote = entity.managerNote ?? null

    if (entity.admin) {
      this.admin = {
        adminId: entity.admin.adminId,
        userId: entity.admin.userId,
        fullName: entity.admin.getFullName(),
      }
    }
  }
}
