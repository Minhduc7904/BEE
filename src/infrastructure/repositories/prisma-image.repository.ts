import { Injectable } from '@nestjs/common'
import { IImageRepository, CreateImageData } from '../../domain/repositories/image.repository'
import { Image } from '../../domain/entities/image/image.entity'
import { NumberUtil } from '../../shared/utils/number.util'

@Injectable()
export class PrismaImageRepository implements IImageRepository {
  constructor(
    private readonly prisma: any, // PrismaService or TransactionClient
  ) { }

  async create(data: CreateImageData): Promise<Image> {
    const image = await this.prisma.image.create({
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        adminId: data.adminId,
      },
    })

    return new Image(
      image.imageId,
      image.adminId,
      image.url,
      image.anotherUrl,
      image.mimeType,
      image.storageProvider,
      image.createdAt,
      image.updatedAt,
    )
  }

  async findById(id: number): Promise<Image | null> {
    const numericUserId = NumberUtil.ensureValidId(id, 'Image')

    const image = await this.prisma.image.findUnique({
      where: { imageId: numericUserId },
    })

    if (!image) return null

    return new Image(
      image.imageId,
      image.adminId,
      image.url,
      image.anotherUrl,
      image.mimeType,
      image.storageProvider,
      image.createdAt,
      image.updatedAt,
    )
  }

  async findByUrl(url: string): Promise<Image | null> {
    const image = await this.prisma.image.findUnique({
      where: { url },
    })

    if (!image) return null

    return new Image(
      image.imageId,
      image.adminId,
      image.url,
      image.anotherUrl,
      image.mimeType,
      image.storageProvider,
      image.createdAt,
      image.updatedAt,
    )
  }

  async findByAdmin(adminId: number): Promise<Image[]> {
    const numericAdminId = NumberUtil.ensureValidId(adminId, 'Admin')

    const images = await this.prisma.image.findMany({
      where: { adminId: numericAdminId },
      orderBy: { createdAt: 'desc' },
    })

    return images.map(
      (img) =>
        new Image(
          img.imageId,
          img.adminId,
          img.url,
          img.anotherUrl,
          img.mimeType,
          img.storageProvider,
          img.createdAt,
          img.updatedAt,
        ),
    )
  }

  async update(id: number, data: Partial<CreateImageData>): Promise<Image> {
    const numericUserId = NumberUtil.ensureValidId(id, 'Image')

    const image = await this.prisma.image.update({
      where: { imageId: numericUserId },
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
      },
    })

    return new Image(
      image.imageId,
      image.adminId,
      image.url,
      image.anotherUrl,
      image.mimeType,
      image.storageProvider,
      image.createdAt,
      image.updatedAt,
    )
  }

  async delete(id: number): Promise<boolean> {
    const numericUserId = NumberUtil.ensureValidId(id, 'Image')
    try {
      await this.prisma.image.delete({
        where: { imageId: numericUserId },
      })
      return true
    } catch (error) {
      return false
    }
  }
}
