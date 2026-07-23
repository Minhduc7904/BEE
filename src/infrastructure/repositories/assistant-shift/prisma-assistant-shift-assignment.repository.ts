import { Prisma } from '@prisma/client'

import { AssistantShiftAssignment } from '../../../domain/entities/assistant-shift'
import type {
  AssistantShiftAssignmentListOptions,
  CreateAssistantShiftAssignmentData,
  UpdateAssistantShiftAssignmentData,
} from '../../../domain/interface/assistant-shift'
import type { IAssistantShiftAssignmentRepository } from '../../../domain/repositories/assistant-shift-assignment.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { AssistantShiftAssignmentMapper } from '../../mappers/assistant-shift'

export class PrismaAssistantShiftAssignmentRepository implements IAssistantShiftAssignmentRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateAssistantShiftAssignmentData): Promise<AssistantShiftAssignment> {
    const created = await this.prisma.assistantShiftAssignment.create({
      data: {
        assistantShiftId: data.assistantShiftId,
        adminId: data.adminId,
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
