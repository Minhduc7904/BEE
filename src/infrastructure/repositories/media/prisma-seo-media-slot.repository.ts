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
    description?: string | null
    isActive?: boolean
  }): Promise<SeoMediaSlotEntity> {
    const slot = await this.prisma.seoMediaSlot.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
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
      description?: string | null
      isActive?: boolean
    },
  ): Promise<SeoMediaSlotEntity> {
    const updateData: Prisma.SeoMediaSlotUpdateInput = {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
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

  async count(filters?: { code?: string; isActive?: boolean }): Promise<number> {
    return this.prisma.seoMediaSlot.count({
      where: filters,
    })
  }
}
