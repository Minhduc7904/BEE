import { Injectable } from '@nestjs/common'
import { IMediaImageRepository, CreateMediaImageData } from '../../domain/repositories'
import { MediaImage } from '../../domain/entities'
import { MediaImageMapper } from '../mappers'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaMediaImageRepository implements IMediaImageRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

  async create(data: CreateMediaImageData): Promise<MediaImage> {
    const mediaImage = await this.prisma.mediaImage.create({
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        caption: data.caption,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        adminId: data.adminId,
      },
      include: { admin: true },
    })

    return MediaImageMapper.toDomainMediaImage(mediaImage)!
  }

  async findById(id: number): Promise<MediaImage | null> {
    const mediaImage = await this.prisma.mediaImage.findUnique({
      where: { imageId: id },
      include: { admin: true },
    })

    return MediaImageMapper.toDomainMediaImage(mediaImage)
  }

  async findByUrl(url: string): Promise<MediaImage | null> {
    const mediaImage = await this.prisma.mediaImage.findUnique({
      where: { url },
      include: { admin: true },
    })

    return MediaImageMapper.toDomainMediaImage(mediaImage)
  }

  async findByAdmin(adminId: number): Promise<MediaImage[]> {
    const mediaImages = await this.prisma.mediaImage.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    })

    return MediaImageMapper.toDomainMediaImages(mediaImages)
  }

  async update(id: number, data: Partial<CreateMediaImageData>): Promise<MediaImage> {
    const mediaImage = await this.prisma.mediaImage.update({
      where: { imageId: id },
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        caption: data.caption,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
      },
      include: { admin: true },
    })

    return MediaImageMapper.toDomainMediaImage(mediaImage)!
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.mediaImage.delete({
        where: { imageId: id },
      })
      return true
    } catch {
      return false
    }
  }
}
