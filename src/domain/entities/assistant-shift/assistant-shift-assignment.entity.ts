import { AssistantShiftAssignmentAttendanceStatus } from '../../../shared/enums'
import { Admin } from '../user/admin.entity'

/**
 * Phân công một trợ giảng (admin) vào một ca và kết quả chấm công của ca đó.
 */
export class AssistantShiftAssignment {
  assistantShiftId: number
  adminId: number
  assignedAt: Date
  attendanceStatus: AssistantShiftAssignmentAttendanceStatus
  updatedAt: Date
  absenceReason?: string | null
  managerNote?: string | null
  admin?: Admin

  constructor(data: {
    assistantShiftId: number
    adminId: number
    assignedAt?: Date
    attendanceStatus?: AssistantShiftAssignmentAttendanceStatus
    updatedAt?: Date
    absenceReason?: string | null
    managerNote?: string | null
    admin?: Admin
  }) {
    this.assistantShiftId = data.assistantShiftId
    this.adminId = data.adminId
    this.assignedAt = data.assignedAt ?? new Date()
    this.attendanceStatus = data.attendanceStatus ?? AssistantShiftAssignmentAttendanceStatus.PENDING
    this.updatedAt = data.updatedAt ?? new Date()
    this.absenceReason = data.absenceReason ?? null
    this.managerNote = data.managerNote ?? null
    this.admin = data.admin
  }

  isPending(): boolean {
    return this.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PENDING
  }

  isPresent(): boolean {
    return this.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT
  }

  isAbsent(): boolean {
    return this.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.ABSENT
  }
}
