import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { SeoMediaSlotEntity } from '../../../domain/entities'
import { ISeoMediaSlotRepository } from '../../../domain/repositories/seo-media-slot.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { SeoMediaSlotMapper } from '../../mappers/media/seo-media-slot.mapper'

@Injectable()
export class PrismaSeoMediaSlotRepository implements ISeoMediaSlotRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  private buildInclude(options?: {
    includeItems?: boolean
  }): Prisma.SeoMediaSlotInclude | undefined {
    if (!options?.includeItems) {
      return undefined
    }

    return {
      items: {
        orderBy: [{ sortOrder: 'asc' as const }, { itemId: 'asc' as const }],
      },
    }
  }

  async create(data: {
    code: string
    name: string
    pageKey?: string | null
    type?: string
    description?: string | null
    isActive?: boolean
    minItems?: number
    maxItems?: number | null
    recommendedWidth?: number | null
    recommendedHeight?: number | null
    metadata?: unknown | null
  }): Promise<SeoMediaSlotEntity> {
    const slot = await this.prisma.seoMediaSlot.create({
      data: {
        code: data.code,
        name: data.name,
        pageKey: data.pageKey ?? null,
        type: data.type ?? 'image',
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        minItems: data.minItems ?? 0,
        maxItems: data.maxItems ?? null,
        recommendedWidth: data.recommendedWidth ?? null,
        recommendedHeight: data.recommendedHeight ?? null,
        metadata: data.metadata === undefined ? undefined : data.metadata as Prisma.InputJsonValue,
      },
    })

    return SeoMediaSlotMapper.toDomain(slot)
  }

  async upsertByCode(data: {
    code: string
    name: string
    pageKey?: string | null
    type?: string
    description?: string | null
    isActive?: boolean
    minItems?: number
    maxItems?: number | null
    recommendedWidth?: number | null
    recommendedHeight?: number | null
    metadata?: unknown | null
  }): Promise<SeoMediaSlotEntity> {
    const normalizedData = {
      code: data.code,
      name: data.name,
      pageKey: data.pageKey ?? null,
      type: data.type ?? 'image',
      description: data.description ?? null,
      isActive: data.isActive ?? true,
      minItems: data.minItems ?? 0,
      maxItems: data.maxItems ?? null,
      recommendedWidth: data.recommendedWidth ?? null,
      recommendedHeight: data.recommendedHeight ?? null,
      metadata: data.metadata === undefined ? undefined : data.metadata as Prisma.InputJsonValue,
    }

    const slot = await this.prisma.seoMediaSlot.upsert({
      where: { code: data.code },
      create: normalizedData,
      update: {
        name: normalizedData.name,
        pageKey: normalizedData.pageKey,
        type: normalizedData.type,
        description: normalizedData.description,
        isActive: normalizedData.isActive,
        minItems: normalizedData.minItems,
        maxItems: normalizedData.maxItems,
        recommendedWidth: normalizedData.recommendedWidth,
        recommendedHeight: normalizedData.recommendedHeight,
        ...(normalizedData.metadata !== undefined && { metadata: normalizedData.metadata }),
      },
    })

    return SeoMediaSlotMapper.toDomain(slot)
  }

  async findById(
    slotId: number,
    options?: {
      includeItems?: boolean
    },
  ): Promise<SeoMediaSlotEntity | null> {
    const slot = await this.prisma.seoMediaSlot.findUnique({
      where: { slotId },
      include: this.buildInclude(options),
    })

    return slot ? SeoMediaSlotMapper.toDomain(slot, options) : null
  }

  async findByCode(
    code: string,
    options?: {
      includeItems?: boolean
    },
  ): Promise<SeoMediaSlotEntity | null> {
    const slot = await this.prisma.seoMediaSlot.findUnique({
      where: { code },
      include: this.buildInclude(options),
    })

    return slot ? SeoMediaSlotMapper.toDomain(slot, options) : null
  }

  async findAll(filters?: {
    code?: string
    pageKey?: string
    type?: string
    isActive?: boolean
    includeItems?: boolean
    skip?: number
    take?: number
  }): Promise<SeoMediaSlotEntity[]> {
    const { includeItems, skip, take, ...where } = filters || {}
    const options = { includeItems }

    const slots = await this.prisma.seoMediaSlot.findMany({
      where,
      skip,
      take,
      include: this.buildInclude(options),
      orderBy: { createdAt: 'desc' },
    })

    return SeoMediaSlotMapper.toDomainList(slots, options)
  }

  async update(
    slotId: number,
    data: {
      code?: string
      name?: string
      pageKey?: string | null
      type?: string
      description?: string | null
      isActive?: boolean
      minItems?: number
      maxItems?: number | null
      recommendedWidth?: number | null
      recommendedHeight?: number | null
      metadata?: unknown | null
    },
  ): Promise<SeoMediaSlotEntity> {
    const updateData: Prisma.SeoMediaSlotUpdateInput = {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.pageKey !== undefined && { pageKey: data.pageKey }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.minItems !== undefined && { minItems: data.minItems }),
      ...(data.maxItems !== undefined && { maxItems: data.maxItems }),
      ...(data.recommendedWidth !== undefined && { recommendedWidth: data.recommendedWidth }),
      ...(data.recommendedHeight !== undefined && { recommendedHeight: data.recommendedHeight }),
      ...(data.metadata !== undefined && { metadata: data.metadata as Prisma.InputJsonValue }),
    }

    const slot = await this.prisma.seoMediaSlot.update({
      where: { slotId },
      data: updateData,
    })

    return SeoMediaSlotMapper.toDomain(slot)
  }

  async delete(slotId: number): Promise<void> {
    await this.prisma.seoMediaSlot.delete({
      where: { slotId },
    })
  }

  async count(filters?: {
    code?: string
    pageKey?: string
    type?: string
    isActive?: boolean
  }): Promise<number> {
    return this.prisma.seoMediaSlot.count({
      where: filters,
    })
  }
}
