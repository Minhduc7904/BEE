import { Prisma } from '@prisma/client'

import { AssistantTaskProduct } from '../../../domain/entities/assistant-task'
import type {
  AssistantTaskProductListOptions,
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
        assistantTaskId: data.assistantTaskId ?? null,
        name: data.name ?? null,
        quantity: data.quantity ?? null,
      },
    })

    return AssistantTaskProductMapper.toDomain(created)!
  }

  async findById(assistantTaskProductId: number): Promise<AssistantTaskProduct | null> {
    const record = await this.prisma.assistantTaskProduct.findUnique({
      where: { assistantTaskProductId },
    })

    return AssistantTaskProductMapper.toDomain(record)
  }

  async findAll(options?: AssistantTaskProductListOptions): Promise<AssistantTaskProduct[]> {
    const records = await this.prisma.assistantTaskProduct.findMany({
      where: {
        ...(options?.assistantTaskId !== undefined && { assistantTaskId: options.assistantTaskId }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { assistantTaskProductId: 'asc' },
    })

    return AssistantTaskProductMapper.toDomainList(records)
  }

  async update(assistantTaskProductId: number, data: UpdateAssistantTaskProductData): Promise<AssistantTaskProduct> {
    const updated = await this.prisma.assistantTaskProduct.update({
      where: { assistantTaskProductId },
      data: {
        ...(data.assistantTaskId !== undefined && { assistantTaskId: data.assistantTaskId }),
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
}
