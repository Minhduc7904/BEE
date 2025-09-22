import { Injectable } from '@nestjs/common'
import {
  ISolutionImageRepository,
  CreateSolutionImageData,
} from '../../domain/repositories'
import { SolutionImage } from '../../domain/entities'
import { SolutionImageMapper } from '../mappers'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaSolutionImageRepository implements ISolutionImageRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client


  async create(data: CreateSolutionImageData): Promise<SolutionImage> {
    const solutionImage = await this.prisma.solutionImage.create({
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

    return SolutionImageMapper.toDomainSolutionImage(solutionImage)!
  }

  async findById(id: number): Promise<SolutionImage | null> {
    const solutionImage = await this.prisma.solutionImage.findUnique({
      where: { imageId: id },
      include: { admin: true },
    })

    return SolutionImageMapper.toDomainSolutionImage(solutionImage)
  }

  async findByUrl(url: string): Promise<SolutionImage | null> {
    const solutionImage = await this.prisma.solutionImage.findUnique({
      where: { url },
      include: { admin: true },
    })

    return SolutionImageMapper.toDomainSolutionImage(solutionImage)
  }

  async findByAdmin(adminId: number): Promise<SolutionImage[]> {
    const solutionImages = await this.prisma.solutionImage.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    })

    return SolutionImageMapper.toDomainSolutionImages(solutionImages)
  }

  async update(id: number, data: Partial<CreateSolutionImageData>): Promise<SolutionImage> {
    const solutionImage = await this.prisma.solutionImage.update({
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

    return SolutionImageMapper.toDomainSolutionImage(solutionImage)!
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.solutionImage.delete({
        where: { imageId: id },
      })
      return true
    } catch {
      return false
    }
  }
}
