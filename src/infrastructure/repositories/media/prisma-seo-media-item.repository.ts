import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { SeoMediaItemEntity } from '../../../domain/entities'
import { ISeoMediaItemRepository } from '../../../domain/repositories/seo-media-item.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { SeoMediaItemMapper } from '../../mappers/media/seo-media-item.mapper'
import { MediaType } from 'src/shared/enums'

@Injectable()
export class PrismaSeoMediaItemRepository implements ISeoMediaItemRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private buildInclude(options?: { includeSlot?: boolean }) {
    const include: Record<string, boolean> = {}

    if (options?.includeSlot) {
      include.slot = true
    }

    return Object.keys(include).length > 0 ? include : undefined
  }

  async create(
    data: {
      slotId: number
      bucketName: string
      objectKey: string
      publicUrl: string
      originalName: string
      mimeType: string
      mediaType: MediaType
      fileSize: number
      width?: number | null
      height?: number | null
      duration?: number | null
      sortOrder?: number
      alt?: string | null
      linkUrl?: string | null
    },
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity> {
    const item = await this.prisma.seoMediaItem.create({
      data: {
        slotId: data.slotId,
        bucketName: data.bucketName,
        objectKey: data.objectKey,
        publicUrl: data.publicUrl,
        originalName: data.originalName,
        mimeType: data.mimeType,
        mediaType: data.mediaType,
        fileSize: BigInt(data.fileSize),
        width: data.width ?? null,
        height: data.height ?? null,
        duration: data.duration ?? null,
        sortOrder: data.sortOrder ?? 0,
        alt: data.alt ?? null,
        linkUrl: data.linkUrl ?? null,
      },
      include: this.buildInclude(options),
    })

    return SeoMediaItemMapper.toDomain(item, options)
  }

  async findById(
    itemId: number,
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity | null> {
    const item = await this.prisma.seoMediaItem.findUnique({
      where: { itemId },
      include: this.buildInclude(options),
    })

    return item ? SeoMediaItemMapper.toDomain(item, options) : null
  }

  async findBySlotId(
    slotId: number,
    options?: {
      includeSlot?: boolean
      skip?: number
      take?: number
    },
  ): Promise<SeoMediaItemEntity[]> {
    const { skip, take, ...relationOptions } = options || {}
    const items = await this.prisma.seoMediaItem.findMany({
      where: { slotId },
      skip,
      take,
      include: this.buildInclude(relationOptions),
      orderBy: [{ sortOrder: 'asc' }, { itemId: 'asc' }],
    })

    return SeoMediaItemMapper.toDomainList(items, relationOptions)
  }

  async findBySlotAndObjectKey(
    slotId: number,
    objectKey: string,
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity | null> {
    const item = await this.prisma.seoMediaItem.findFirst({
      where: {
        slotId,
        objectKey,
      },
      include: this.buildInclude(options),
    })

    return item ? SeoMediaItemMapper.toDomain(item, options) : null
  }

  async update(
    itemId: number,
    data: {
      slotId?: number
      bucketName?: string
      objectKey?: string
      publicUrl?: string
      originalName?: string
      mimeType?: string
      mediaType?: MediaType
      fileSize?: number
      width?: number | null
      height?: number | null
      duration?: number | null
      sortOrder?: number
      alt?: string | null
      linkUrl?: string | null
    },
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity> {
    const updateData: Prisma.SeoMediaItemUpdateInput = {
      ...(data.slotId !== undefined && { slot: { connect: { slotId: data.slotId } } }),
      ...(data.bucketName !== undefined && { bucketName: data.bucketName }),
      ...(data.objectKey !== undefined && { objectKey: data.objectKey }),
      ...(data.publicUrl !== undefined && { publicUrl: data.publicUrl }),
      ...(data.originalName !== undefined && { originalName: data.originalName }),
      ...(data.mimeType !== undefined && { mimeType: data.mimeType }),
      ...(data.mediaType !== undefined && { mediaType: data.mediaType }),
      ...(data.fileSize !== undefined && { fileSize: BigInt(data.fileSize) }),
      ...(data.width !== undefined && { width: data.width }),
      ...(data.height !== undefined && { height: data.height }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.alt !== undefined && { alt: data.alt }),
      ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
    }

    const item = await this.prisma.seoMediaItem.update({
      where: { itemId },
      data: updateData,
      include: this.buildInclude(options),
    })

    return SeoMediaItemMapper.toDomain(item, options)
  }

  async delete(itemId: number): Promise<void> {
    await this.prisma.seoMediaItem.delete({
      where: { itemId },
    })
  }

  async deleteBySlotId(slotId: number): Promise<number> {
    const result = await this.prisma.seoMediaItem.deleteMany({
      where: { slotId },
    })

    return result.count
  }

  async count(filters?: { slotId?: number; objectKey?: string }): Promise<number> {
    return this.prisma.seoMediaItem.count({
      where: filters,
    })
  }
}
