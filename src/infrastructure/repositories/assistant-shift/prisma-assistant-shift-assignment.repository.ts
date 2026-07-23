import { Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'

import { AssistantShiftAssignment } from '../../../domain/entities/assistant-shift'
import type {
  AssistantShiftAssignmentListOptions,
  AssistantShiftReminderCandidate,
  CreateAssistantShiftAssignmentData,
  UpdateAssistantShiftAssignmentData,
} from '../../../domain/interface/assistant-shift'
import type { IAssistantShiftAssignmentRepository } from '../../../domain/repositories/assistant-shift-assignment.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../shared/enums'
import { AssistantShiftAssignmentMapper } from '../../mappers/assistant-shift'

const AUTO_ABSENCE_REASON = 'Không điểm danh trước khi ca kết thúc'

export class PrismaAssistantShiftAssignmentRepository implements IAssistantShiftAssignmentRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateAssistantShiftAssignmentData): Promise<AssistantShiftAssignment> {
    const created = await this.prisma.assistantShiftAssignment.create({
      data: {
        assistantShiftId: data.assistantShiftId,
        adminId: data.adminId,
        token: randomBytes(32).toString('hex'),
        shouldSendReminderEmail: true,
        ...(data.attendanceStatus !== undefined && { attendanceStatus: data.attendanceStatus }),
        absenceReason: data.absenceReason ?? null,
        managerNote: data.managerNote ?? null,
      },
    })

    return AssistantShiftAssignmentMapper.toDomain(created)!
  }

  async findById(assistantShiftId: number, adminId: number): Promise<AssistantShiftAssignment | null> {
    const record = await this.prisma.assistantShiftAssignment.findUnique({
      where: { assistantShiftId_adminId: { assistantShiftId, adminId } },
    })

    return AssistantShiftAssignmentMapper.toDomain(record)
  }

  async findByCheckInToken(assistantShiftId: number, token: string): Promise<AssistantShiftAssignment | null> {
    const record = await this.prisma.assistantShiftAssignment.findFirst({
      where: { assistantShiftId, token },
    })

    return AssistantShiftAssignmentMapper.toDomain(record)
  }

  async findAll(options?: AssistantShiftAssignmentListOptions): Promise<AssistantShiftAssignment[]> {
    const records = await this.prisma.assistantShiftAssignment.findMany({
      where: {
        ...(options?.assistantShiftId !== undefined && { assistantShiftId: options.assistantShiftId }),
        ...(options?.adminId !== undefined && { adminId: options.adminId }),
        ...(options?.attendanceStatus !== undefined && { attendanceStatus: options.attendanceStatus }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ assignedAt: 'desc' }, { assistantShiftId: 'desc' }],
    })

    return AssistantShiftAssignmentMapper.toDomainList(records)
  }

  async findCheckInReminderCandidates(now: Date): Promise<AssistantShiftReminderCandidate[]> {
    const records = await this.prisma.assistantShiftAssignment.findMany({
      where: {
        shouldSendReminderEmail: true,
        checkInReminderSentAt: null,
        token: { not: null },
        attendanceStatus: 'PENDING',
        assistantShift: {
          startAt: { lte: new Date(now.getTime() + 45 * 60 * 1000) },
          endAt: { gte: now },
        },
        admin: { user: { isActive: true, email: { not: null } } },
      },
      select: {
        assistantShiftId: true,
        adminId: true,
        token: true,
        attendanceStatus: true,
        assistantShift: { select: { name: true, startAt: true, endAt: true } },
        admin: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    })

    return records.flatMap((record) => {
      const email = record.admin.user.email?.trim()
      if (!record.token || !email) return []

      return [{
        assistantShiftId: record.assistantShiftId,
        adminId: record.adminId,
        token: record.token,
        assistantShiftName: record.assistantShift.name,
        startAt: record.assistantShift.startAt,
        endAt: record.assistantShift.endAt,
        recipientEmail: email,
        recipientName: `${record.admin.user.lastName} ${record.admin.user.firstName}`.trim(),
        attendanceStatus: record.attendanceStatus as AssistantShiftAssignmentAttendanceStatus,
      }]
    })
  }

  async findExpiredAbsenceCandidates(now: Date): Promise<AssistantShiftReminderCandidate[]> {
    const records = await this.prisma.assistantShiftAssignment.findMany({
      where: {
        shouldSendReminderEmail: true,
        absenceEmailSentAt: null,
        OR: [
          { attendanceStatus: 'PENDING' },
          {
            attendanceStatus: 'ABSENT',
            absenceReason: AUTO_ABSENCE_REASON,
          },
        ],
        assistantShift: { endAt: { lt: now } },
        admin: { user: { isActive: true } },
      },
      select: {
        assistantShiftId: true,
        adminId: true,
        token: true,
        attendanceStatus: true,
        assistantShift: { select: { name: true, startAt: true, endAt: true } },
        admin: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    })

    return records.map((record) => {
      const email = record.admin.user.email?.trim() || null

      return {
        assistantShiftId: record.assistantShiftId,
        adminId: record.adminId,
        token: record.token,
        assistantShiftName: record.assistantShift.name,
        startAt: record.assistantShift.startAt,
        endAt: record.assistantShift.endAt,
        recipientEmail: email,
        recipientName: `${record.admin.user.lastName} ${record.admin.user.firstName}`.trim(),
        attendanceStatus: record.attendanceStatus as AssistantShiftAssignmentAttendanceStatus,
      }
    })
  }

  async claimCheckInReminderEmail(
    assistantShiftId: number,
    adminId: number,
    sentAt: Date,
  ): Promise<boolean> {
    const result = await this.prisma.assistantShiftAssignment.updateMany({
      where: {
        assistantShiftId,
        adminId,
        shouldSendReminderEmail: true,
        checkInReminderSentAt: null,
        attendanceStatus: 'PENDING',
      },
      data: { checkInReminderSentAt: sentAt },
    })

    return result.count === 1
  }

  async requeueCheckInReminderEmail(assistantShiftId: number, adminId: number): Promise<void> {
    await this.prisma.assistantShiftAssignment.update({
      where: { assistantShiftId_adminId: { assistantShiftId, adminId } },
      data: { checkInReminderSentAt: null },
    })
  }

  async claimAbsenceNotification(
    assistantShiftId: number,
    adminId: number,
    attendanceStatus: AssistantShiftAssignmentAttendanceStatus,
    sentAt: Date,
  ): Promise<boolean> {
    const isPending = attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PENDING
    const result = await this.prisma.assistantShiftAssignment.updateMany({
      where: {
        assistantShiftId,
        adminId,
        shouldSendReminderEmail: true,
        absenceEmailSentAt: null,
        attendanceStatus: isPending ? 'PENDING' : 'ABSENT',
        ...(!isPending && { absenceReason: AUTO_ABSENCE_REASON }),
      },
      data: {
        absenceEmailSentAt: sentAt,
        ...(isPending && {
          attendanceStatus: 'ABSENT',
          absenceReason: AUTO_ABSENCE_REASON,
        }),
      },
    })

    return result.count === 1
  }

  async requeueAbsenceNotification(assistantShiftId: number, adminId: number): Promise<void> {
    await this.prisma.assistantShiftAssignment.update({
      where: { assistantShiftId_adminId: { assistantShiftId, adminId } },
      data: { absenceEmailSentAt: null },
    })
  }

  async update(
    assistantShiftId: number,
    adminId: number,
    data: UpdateAssistantShiftAssignmentData,
  ): Promise<AssistantShiftAssignment> {
    const updated = await this.prisma.assistantShiftAssignment.update({
      where: { assistantShiftId_adminId: { assistantShiftId, adminId } },
      data: {
        ...(data.attendanceStatus !== undefined && { attendanceStatus: data.attendanceStatus }),
        ...(data.absenceReason !== undefined && { absenceReason: data.absenceReason }),
        ...(data.managerNote !== undefined && { managerNote: data.managerNote }),
      },
    })

    return AssistantShiftAssignmentMapper.toDomain(updated)!
  }

  async delete(assistantShiftId: number, adminId: number): Promise<boolean> {
    await this.prisma.assistantShiftAssignment.delete({
      where: { assistantShiftId_adminId: { assistantShiftId, adminId } },
    })

    return true
  }
}
