import { Prisma } from '@prisma/client'

import { AssistantShift } from '../../../domain/entities/assistant-shift'
import type {
  AssistantShiftListOptions,
  AssistantShiftRelationOptions,
  CreateAssistantShiftData,
  UpdateAssistantShiftData,
} from '../../../domain/interface/assistant-shift'
import type { IAssistantShiftRepository } from '../../../domain/repositories/assistant-shift.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { AssistantShiftMapper } from '../../mappers/assistant-shift'

export class PrismaAssistantShiftRepository implements IAssistantShiftRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateAssistantShiftData): Promise<AssistantShift> {
    const created = await this.prisma.assistantShift.create({
      data: {
        assistantShiftSeriesId: data.assistantShiftSeriesId,
        classId: data.classId ?? null,
        name: data.name,
        notes: data.notes ?? null,
        startAt: data.startAt,
        endAt: data.endAt,
        isLocked: data.isLocked ?? false,
        selfRegistrationOpenAt: data.selfRegistrationOpenAt ?? null,
        selfRegistrationCloseAt: data.selfRegistrationCloseAt ?? null,
        requiredAssistantCount: data.requiredAssistantCount ?? 1,
      },
    })

    return AssistantShiftMapper.toDomain(created)!
  }

  async findById(
    assistantShiftId: number,
    options?: AssistantShiftRelationOptions,
  ): Promise<AssistantShift | null> {
    if (options?.includeSeries && options.includeAssignmentsWithAdmin && options.includeCourseClass) {
      const record = await this.prisma.assistantShift.findUnique({
        where: { assistantShiftId },
        include: {
          series: true,
          courseClass: true,
          assignments: { include: { admin: { include: { user: true } } } },
        },
      })

      return AssistantShiftMapper.toDomainWithClassDetails(record)
    }

    if (options?.includeSeries && options.includeAssignmentsWithAdmin) {
      const record = await this.prisma.assistantShift.findUnique({
        where: { assistantShiftId },
        include: {
          series: true,
          assignments: { include: { admin: { include: { user: true } } } },
        },
      })

      return AssistantShiftMapper.toDomainWithDetails(record)
    }

    if (options?.includeSeries) {
      const record = await this.prisma.assistantShift.findUnique({
        where: { assistantShiftId },
        include: { series: true },
      })

      return AssistantShiftMapper.toDomainWithSeries(record)
    }

    if (options?.includeAssignmentsWithAdmin) {
      const record = await this.prisma.assistantShift.findUnique({
        where: { assistantShiftId },
        include: { assignments: { include: { admin: { include: { user: true } } } } },
      })

      return AssistantShiftMapper.toDomainWithAssignments(record)
    }

    const record = await this.prisma.assistantShift.findUnique({
      where: { assistantShiftId },
    })

    return AssistantShiftMapper.toDomain(record)
  }

  async findAll(options?: AssistantShiftListOptions): Promise<AssistantShift[]> {
    const where: Prisma.AssistantShiftWhereInput = {
      ...(options?.assistantShiftSeriesId !== undefined && {
        assistantShiftSeriesId: options.assistantShiftSeriesId,
      }),
      ...(options?.classId !== undefined && { classId: options.classId }),
      ...((options?.startAtFrom !== undefined || options?.startAtTo !== undefined) && {
        startAt: {
          ...(options.startAtFrom !== undefined && { gte: options.startAtFrom }),
          ...(options.startAtTo !== undefined && { lte: options.startAtTo }),
        },
      }),
      ...(options?.assignedAdminId !== undefined && {
        assignments: { some: { adminId: options.assignedAdminId } },
      }),
      ...(options?.onlyUnlocked && {
        isLocked: false,
        series: { is: { isLocked: false } },
      }),
    }

    if (options?.includeSeries && options.includeCourseClass && options.includeAssignmentsForAdminId !== undefined) {
      const records = await this.prisma.assistantShift.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: [{ startAt: 'asc' }, { assistantShiftId: 'asc' }],
        include: {
          series: true,
          courseClass: true,
          assignments: {
            where: { adminId: options.includeAssignmentsForAdminId },
            include: { admin: { include: { user: true } } },
          },
        },
      })

      return AssistantShiftMapper.toDomainListWithClassDetails(records)
    }

    if (options?.includeSeries && options.includeAssignmentsWithAdmin && options.includeCourseClass) {
      const records = await this.prisma.assistantShift.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: [{ startAt: 'asc' }, { assistantShiftId: 'asc' }],
        include: {
          series: true,
          courseClass: true,
          assignments: { include: { admin: { include: { user: true } } } },
        },
      })

      return AssistantShiftMapper.toDomainListWithClassDetails(records)
    }

    if (options?.includeSeries && options.includeAssignmentsWithAdmin) {
      const records = await this.prisma.assistantShift.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: [{ startAt: 'asc' }, { assistantShiftId: 'asc' }],
        include: {
          series: true,
          assignments: { include: { admin: { include: { user: true } } } },
        },
      })

      return AssistantShiftMapper.toDomainListWithDetails(records)
    }

    if (options?.includeAssignmentsWithAdmin) {
      const records = await this.prisma.assistantShift.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: [{ startAt: 'asc' }, { assistantShiftId: 'asc' }],
        include: {
          assignments: { include: { admin: { include: { user: true } } } },
        },
      })

      return AssistantShiftMapper.toDomainListWithAssignments(records)
    }

    if (options?.includeAssignmentsForAdminId !== undefined) {
      const records = await this.prisma.assistantShift.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: [{ startAt: 'asc' }, { assistantShiftId: 'asc' }],
        include: {
          assignments: {
            where: { adminId: options.includeAssignmentsForAdminId },
            include: { admin: { include: { user: true } } },
          },
        },
      })

      return AssistantShiftMapper.toDomainListWithAssignments(records)
    }

    const records = await this.prisma.assistantShift.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ startAt: 'asc' }, { assistantShiftId: 'asc' }],
    })

    return AssistantShiftMapper.toDomainList(records)
  }

  async hasOverlappingTimeRange(
    assistantShiftSeriesId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    const count = await this.prisma.assistantShift.count({
      where: {
        assistantShiftSeriesId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    })

    return count > 0
  }

  async updateBySeriesAndStartAtRange(
    assistantShiftSeriesId: number,
    startAt: Date,
    endAt: Date,
    data: UpdateAssistantShiftData,
  ): Promise<number> {
    const result = await this.prisma.assistantShift.updateMany({
      where: {
        assistantShiftSeriesId,
        startAt: { gte: startAt, lte: endAt },
      },
      data: {
        ...(data.isLocked !== undefined && { isLocked: data.isLocked }),
        ...(data.selfRegistrationOpenAt !== undefined && {
          selfRegistrationOpenAt: data.selfRegistrationOpenAt,
        }),
        ...(data.selfRegistrationCloseAt !== undefined && {
          selfRegistrationCloseAt: data.selfRegistrationCloseAt,
        }),
      },
    })

    return result.count
  }

  async update(assistantShiftId: number, data: UpdateAssistantShiftData): Promise<AssistantShift> {
    const updated = await this.prisma.assistantShift.update({
      where: { assistantShiftId },
      data: {
        ...(data.assistantShiftSeriesId !== undefined && {
          assistantShiftSeriesId: data.assistantShiftSeriesId,
        }),
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.startAt !== undefined && { startAt: data.startAt }),
        ...(data.endAt !== undefined && { endAt: data.endAt }),
        ...(data.isLocked !== undefined && { isLocked: data.isLocked }),
        ...(data.selfRegistrationOpenAt !== undefined && {
          selfRegistrationOpenAt: data.selfRegistrationOpenAt,
        }),
        ...(data.selfRegistrationCloseAt !== undefined && {
          selfRegistrationCloseAt: data.selfRegistrationCloseAt,
        }),
        ...(data.requiredAssistantCount !== undefined && {
          requiredAssistantCount: data.requiredAssistantCount,
        }),
      },
    })

    return AssistantShiftMapper.toDomain(updated)!
  }

  async delete(assistantShiftId: number): Promise<boolean> {
    await this.prisma.assistantShift.delete({
      where: { assistantShiftId },
    })

    return true
  }
}
