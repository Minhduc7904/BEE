import type { AssistantShiftAssignment as PrismaAssistantShiftAssignment, Prisma } from '@prisma/client'

import { AssistantShiftAssignment } from '../../../domain/entities/assistant-shift'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../shared/enums'
import { AdminMapper } from '../user/admin.mapper'

type PrismaAssistantShiftAssignmentWithAdmin = Prisma.AssistantShiftAssignmentGetPayload<{
  include: { admin: { include: { user: true } } }
}>

export class AssistantShiftAssignmentMapper {
  static toDomain(record: PrismaAssistantShiftAssignment | null | undefined): AssistantShiftAssignment | null {
    if (!record) return null

    return new AssistantShiftAssignment({
      assistantShiftId: record.assistantShiftId,
      adminId: record.adminId,
      assignedAt: record.assignedAt,
      attendanceStatus: record.attendanceStatus as AssistantShiftAssignmentAttendanceStatus,
      token: record.token,
      shouldSendReminderEmail: record.shouldSendReminderEmail,
      checkInReminderSentAt: record.checkInReminderSentAt,
      absenceEmailSentAt: record.absenceEmailSentAt,
      absenceReason: record.absenceReason,
      managerNote: record.managerNote,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainList(records: PrismaAssistantShiftAssignment[] | null | undefined): AssistantShiftAssignment[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomain(record))
      .filter((record): record is AssistantShiftAssignment => record !== null)
  }

  static toDomainWithAdmin(
    record: PrismaAssistantShiftAssignmentWithAdmin | null | undefined,
  ): AssistantShiftAssignment | null {
    if (!record) return null

    return new AssistantShiftAssignment({
      assistantShiftId: record.assistantShiftId,
      adminId: record.adminId,
      assignedAt: record.assignedAt,
      attendanceStatus: record.attendanceStatus as AssistantShiftAssignmentAttendanceStatus,
      token: record.token,
      shouldSendReminderEmail: record.shouldSendReminderEmail,
      checkInReminderSentAt: record.checkInReminderSentAt,
      absenceEmailSentAt: record.absenceEmailSentAt,
      absenceReason: record.absenceReason,
      managerNote: record.managerNote,
      updatedAt: record.updatedAt,
      admin: AdminMapper.toDomainAdmin(record.admin),
    })
  }

  static toDomainListWithAdmin(
    records: PrismaAssistantShiftAssignmentWithAdmin[] | null | undefined,
  ): AssistantShiftAssignment[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomainWithAdmin(record))
      .filter((record): record is AssistantShiftAssignment => record !== null)
  }
}
