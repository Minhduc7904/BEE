import {
  AssistantTaskStatus as PrismaAssistantTaskStatus,
  AssistantTaskType as PrismaAssistantTaskType,
  Prisma,
} from '@prisma/client'

import { AssistantTask } from '../../../domain/entities/assistant-task'
import type {
  AssistantTaskListOptions,
  AssistantTaskRelationOptions,
  CreateAssistantTaskData,
  UpdateAssistantTaskData,
} from '../../../domain/interface/assistant-task'
import type { IAssistantTaskRepository } from '../../../domain/repositories/assistant-task.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { AssistantTaskMapper } from '../../mappers/assistant-task'

export class PrismaAssistantTaskRepository implements IAssistantTaskRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateAssistantTaskData): Promise<AssistantTask> {
    const created = await this.prisma.assistantTask.create({
      data: {
        courseId: data.courseId ?? null,
        assistantId: data.assistantId ?? null,
        taskName: data.taskName ?? null,
        taskType: (data.taskType ?? null) as PrismaAssistantTaskType | null,
        status: (data.status ?? PrismaAssistantTaskStatus.PENDING) as PrismaAssistantTaskStatus,
        isBaseTask: data.isBaseTask ?? false,
        deadlineAt: data.deadlineAt ?? null,
        completedAt: data.completedAt ?? null,
        note: data.note ?? null,
      },
    })

    return AssistantTaskMapper.toDomain(created)!
  }

  async findById(assistantTaskId: number, options?: AssistantTaskRelationOptions): Promise<AssistantTask | null> {
    if (options?.includeProducts) {
      const record = await this.prisma.assistantTask.findUnique({
        where: { assistantTaskId },
        include: {
          submissions: {
            include: {
              assistantTaskProduct: {
                include: {
                  exam: {
                    select: {
                      title: true,
                      solutionYoutubeUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      return AssistantTaskMapper.toDomainWithProducts(record)
    }

    const record = await this.prisma.assistantTask.findUnique({
      where: { assistantTaskId },
    })

    return AssistantTaskMapper.toDomain(record)
  }

  async findAll(options?: AssistantTaskListOptions): Promise<AssistantTask[]> {
    const where = this.buildWhere(options)

    if (options?.includeProducts) {
      const records = await this.prisma.assistantTask.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: [{ deadlineAt: 'asc' }, { assistantTaskId: 'asc' }],
        include: {
          submissions: {
            include: {
              assistantTaskProduct: {
                include: {
                  exam: {
                    select: {
                      title: true,
                      solutionYoutubeUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      return AssistantTaskMapper.toDomainListWithProducts(records)
    }

    const records = await this.prisma.assistantTask.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ deadlineAt: 'asc' }, { assistantTaskId: 'asc' }],
    })

    return AssistantTaskMapper.toDomainList(records)
  }

  async count(options?: AssistantTaskListOptions): Promise<number> {
    return this.prisma.assistantTask.count({
      where: this.buildWhere(options),
    })
  }

  private buildWhere(options?: AssistantTaskListOptions): Prisma.AssistantTaskWhereInput {
    return {
      ...(options?.courseId !== undefined && { courseId: options.courseId }),
      ...(options?.assistantId !== undefined && { assistantId: options.assistantId }),
      ...(options?.taskName !== undefined && {
        taskName: options.taskName,
      }),
      ...(options?.taskType !== undefined && {
        taskType: options.taskType as PrismaAssistantTaskType | null,
      }),
      ...(options?.status !== undefined && {
        status: options.status as PrismaAssistantTaskStatus,
      }),
      ...(options?.isBaseTask !== undefined && { isBaseTask: options.isBaseTask }),
      ...((options?.deadlineAtFrom !== undefined || options?.deadlineAtTo !== undefined) && {
        deadlineAt: {
          ...(options.deadlineAtFrom !== undefined && { gte: options.deadlineAtFrom }),
          ...(options.deadlineAtTo !== undefined && { lte: options.deadlineAtTo }),
        },
      }),
      ...((options?.completedAtFrom !== undefined || options?.completedAtTo !== undefined) && {
        completedAt: {
          ...(options.completedAtFrom !== undefined && { gte: options.completedAtFrom }),
          ...(options.completedAtTo !== undefined && { lte: options.completedAtTo }),
        },
      }),
      ...(options?.productId !== undefined && {
        submissions: {
          some: { assistantTaskProductId: options.productId },
        },
      }),
    }
  }

  async update(assistantTaskId: number, data: UpdateAssistantTaskData): Promise<AssistantTask> {
    const updated = await this.prisma.assistantTask.update({
      where: { assistantTaskId },
      data: {
        ...(data.courseId !== undefined && { courseId: data.courseId }),
        ...(data.assistantId !== undefined && { assistantId: data.assistantId }),
        ...(data.taskName !== undefined && {
          taskName: data.taskName,
        }),
        ...(data.taskType !== undefined && {
          taskType: data.taskType as PrismaAssistantTaskType | null,
        }),
        ...(data.status !== undefined && { status: data.status as PrismaAssistantTaskStatus }),
        ...(data.isBaseTask !== undefined && { isBaseTask: data.isBaseTask }),
        ...(data.deadlineAt !== undefined && { deadlineAt: data.deadlineAt }),
        ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
        ...(data.note !== undefined && { note: data.note }),
      },
    })

    return AssistantTaskMapper.toDomain(updated)!
  }

  async delete(assistantTaskId: number): Promise<boolean> {
    await this.prisma.assistantTask.delete({
      where: { assistantTaskId },
    })

    return true
  }
}
