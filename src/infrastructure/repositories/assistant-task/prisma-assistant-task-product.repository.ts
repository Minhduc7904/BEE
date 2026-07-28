import { Prisma } from '@prisma/client'

import { AssistantTaskProduct } from '../../../domain/entities/assistant-task'
import type {
  AssistantTaskProductListOptions,
  AssistantTaskProductRelationOptions,
  CreateAssistantTaskProductData,
  UpdateAssistantTaskProductData,
} from '../../../domain/interface/assistant-task'
import type { IAssistantTaskProductRepository } from '../../../domain/repositories/assistant-task-product.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { AssistantTaskProductMapper } from '../../mappers/assistant-task'

export class PrismaAssistantTaskProductRepository implements IAssistantTaskProductRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateAssistantTaskProductData): Promise<AssistantTaskProduct> {
    const created = await this.prisma.assistantTaskProduct.create({
      data: {
        assistantId: data.assistantId,
        examId: data.examId ?? null,
        name: data.name ?? null,
        quantity: data.quantity ?? null,
      },
    })

    return AssistantTaskProductMapper.toDomain(created)!
  }

  async findById(
    assistantTaskProductId: number,
    options?: AssistantTaskProductRelationOptions,
  ): Promise<AssistantTaskProduct | null> {
    if (options?.includeTasks) {
      const record = await this.prisma.assistantTaskProduct.findUnique({
        where: { assistantTaskProductId },
        include: {
          submissions: {
            include: { assistantTask: true },
          },
        },
      })

      return AssistantTaskProductMapper.toDomainWithTasks(record)
    }

    const record = await this.prisma.assistantTaskProduct.findUnique({
      where: { assistantTaskProductId },
    })

    return AssistantTaskProductMapper.toDomain(record)
  }

  async findAll(options?: AssistantTaskProductListOptions): Promise<AssistantTaskProduct[]> {
    const where = this.buildWhere(options)

    if (options?.includeTasks) {
      const records = await this.prisma.assistantTaskProduct.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: [{ createdAt: 'desc' }, { assistantTaskProductId: 'desc' }],
        include: {
          submissions: {
            include: { assistantTask: true },
          },
        },
      })

      return AssistantTaskProductMapper.toDomainListWithTasks(records)
    }

    const records = await this.prisma.assistantTaskProduct.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ createdAt: 'desc' }, { assistantTaskProductId: 'desc' }],
    })

    return AssistantTaskProductMapper.toDomainList(records)
  }

  async count(options?: AssistantTaskProductListOptions): Promise<number> {
    return this.prisma.assistantTaskProduct.count({
      where: this.buildWhere(options),
    })
  }

  async update(assistantTaskProductId: number, data: UpdateAssistantTaskProductData): Promise<AssistantTaskProduct> {
    const updated = await this.prisma.assistantTaskProduct.update({
      where: { assistantTaskProductId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
      },
    })

    return AssistantTaskProductMapper.toDomain(updated)!
  }

  async delete(assistantTaskProductId: number): Promise<boolean> {
    await this.prisma.assistantTaskProduct.delete({
      where: { assistantTaskProductId },
    })

    return true
  }

  private buildWhere(options?: AssistantTaskProductListOptions): Prisma.AssistantTaskProductWhereInput {
    return {
      ...(options?.assistantId !== undefined && { assistantId: options.assistantId }),
      ...(options?.examId !== undefined && { examId: options.examId }),
      ...((options?.createdAtFrom !== undefined || options?.createdAtTo !== undefined) && {
        createdAt: {
          ...(options.createdAtFrom !== undefined && { gte: options.createdAtFrom }),
          ...(options.createdAtTo !== undefined && { lte: options.createdAtTo }),
        },
      }),
      ...(options?.taskId !== undefined && {
        submissions: {
          some: { assistantTaskId: options.taskId },
        },
      }),
    }
  }
}
