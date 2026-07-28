import { Prisma } from '@prisma/client'

import { AssistantTaskProductSubmission } from '../../../domain/entities/assistant-task'
import type { AssistantTaskProductSubmissionListOptions } from '../../../domain/interface/assistant-task'
import type { IAssistantTaskProductSubmissionRepository } from '../../../domain/repositories'
import { PrismaService } from '../../../prisma/prisma.service'
import { AssistantTaskProductSubmissionMapper } from '../../mappers/assistant-task'

export class PrismaAssistantTaskProductSubmissionRepository implements IAssistantTaskProductSubmissionRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(assistantTaskId: number, assistantTaskProductId: number): Promise<AssistantTaskProductSubmission> {
    const record = await this.prisma.assistantTaskProductSubmission.create({
      data: { assistantTaskId, assistantTaskProductId },
    })

    return AssistantTaskProductSubmissionMapper.toDomain(record)!
  }

  async findById(assistantTaskProductSubmissionId: number): Promise<AssistantTaskProductSubmission | null> {
    const record = await this.prisma.assistantTaskProductSubmission.findUnique({
      where: { assistantTaskProductSubmissionId },
    })

    return AssistantTaskProductSubmissionMapper.toDomain(record)
  }

  async findByTaskAndProduct(
    assistantTaskId: number,
    assistantTaskProductId: number,
  ): Promise<AssistantTaskProductSubmission | null> {
    const record = await this.prisma.assistantTaskProductSubmission.findUnique({
      where: {
        assistantTaskId_assistantTaskProductId: {
          assistantTaskId,
          assistantTaskProductId,
        },
      },
    })

    return AssistantTaskProductSubmissionMapper.toDomain(record)
  }

  async findAll(options?: AssistantTaskProductSubmissionListOptions): Promise<AssistantTaskProductSubmission[]> {
    const records = await this.prisma.assistantTaskProductSubmission.findMany({
      where: this.buildWhere(options),
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ submittedAt: 'desc' }, { assistantTaskProductSubmissionId: 'desc' }],
    })

    return AssistantTaskProductSubmissionMapper.toDomainList(records)
  }

  async count(options?: AssistantTaskProductSubmissionListOptions): Promise<number> {
    return this.prisma.assistantTaskProductSubmission.count({
      where: this.buildWhere(options),
    })
  }

  async countByTaskId(assistantTaskId: number): Promise<number> {
    return this.prisma.assistantTaskProductSubmission.count({
      where: { assistantTaskId },
    })
  }

  async countByProductId(assistantTaskProductId: number): Promise<number> {
    return this.prisma.assistantTaskProductSubmission.count({
      where: { assistantTaskProductId },
    })
  }

  async delete(assistantTaskId: number, assistantTaskProductId: number): Promise<boolean> {
    await this.prisma.assistantTaskProductSubmission.delete({
      where: {
        assistantTaskId_assistantTaskProductId: {
          assistantTaskId,
          assistantTaskProductId,
        },
      },
    })

    return true
  }

  private buildWhere(
    options?: AssistantTaskProductSubmissionListOptions,
  ): Prisma.AssistantTaskProductSubmissionWhereInput {
    return {
      ...(options?.assistantTaskId !== undefined && {
        assistantTaskId: options.assistantTaskId,
      }),
      ...(options?.assistantTaskProductId !== undefined && {
        assistantTaskProductId: options.assistantTaskProductId,
      }),
      ...((options?.submittedAtFrom !== undefined || options?.submittedAtTo !== undefined) && {
        submittedAt: {
          ...(options.submittedAtFrom !== undefined && { gte: options.submittedAtFrom }),
          ...(options.submittedAtTo !== undefined && { lte: options.submittedAtTo }),
        },
      }),
    }
  }
}
