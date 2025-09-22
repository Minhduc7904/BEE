import { Injectable } from '@nestjs/common'
import { IImageRepository, CreateImageData } from '../../domain/repositories'
import { Image } from '../../domain/entities'
import { NumberUtil } from '../../shared/utils'
import { ImageMapper } from '../mappers'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaImageRepository implements IImageRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

  async create(data: CreateImageData): Promise<Image> {
    const image = await this.prisma.image.create({
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        caption: data.caption,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        adminId: data.adminId,
      },
      include: { admin: true }, // để mapper convert luôn Admin nếu cần
    })

    return ImageMapper.toDomainImage(image)!
  }

  async findById(id: number): Promise<Image | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Image')

    const image = await this.prisma.image.findUnique({
      where: { imageId: numericId },
      include: { admin: true },
    })

    return ImageMapper.toDomainImage(image)
  }

  async findByUrl(url: string): Promise<Image | null> {
    const image = await this.prisma.image.findUnique({
      where: { url },
      include: { admin: true },
    })

    return ImageMapper.toDomainImage(image)
  }

  async findByAdmin(adminId: number): Promise<Image[]> {
    const numericAdminId = NumberUtil.ensureValidId(adminId, 'Admin')

    const images = await this.prisma.image.findMany({
      where: { adminId: numericAdminId },
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    })

    return ImageMapper.toDomainImages(images)
  }

  async update(id: number, data: Partial<CreateImageData>): Promise<Image> {
    const numericId = NumberUtil.ensureValidId(id, 'Image')

    const image = await this.prisma.image.update({
      where: { imageId: numericId },
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        caption: data.caption,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
      },
      include: { admin: true },
    })

    return ImageMapper.toDomainImage(image)!
  }

  async delete(id: number): Promise<boolean> {
    const numericId = NumberUtil.ensureValidId(id, 'Image')
    try {
      await this.prisma.image.delete({
        where: { imageId: numericId },
      })
      return true
    } catch {
      return false
    }
  }
}
