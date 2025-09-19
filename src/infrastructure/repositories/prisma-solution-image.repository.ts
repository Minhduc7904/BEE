import { Injectable } from '@nestjs/common'
import { ISolutionImageRepository, CreateSolutionImageData } from '../../domain/repositories/solution-image.repository'
import { SolutionImage } from '../../domain/entities/image/solution-image.entity'

@Injectable()
export class PrismaSolutionImageRepository implements ISolutionImageRepository {
  constructor(
    private readonly prisma: any, // PrismaService or TransactionClient
  ) {}

  async create(data: CreateSolutionImageData): Promise<SolutionImage> {
    const solutionImage = await this.prisma.solutionImage.create({
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        adminId: data.adminId,
      },
    })

    return new SolutionImage(
      solutionImage.imageId,
      solutionImage.adminId,
      solutionImage.url,
      solutionImage.anotherUrl,
      solutionImage.mimeType,
      solutionImage.storageProvider,
      solutionImage.createdAt,
      solutionImage.updatedAt,
    )
  }

  async findById(id: number): Promise<SolutionImage | null> {
    const solutionImage = await this.prisma.solutionImage.findUnique({
      where: { imageId: id },
    })

    if (!solutionImage) return null

    return new SolutionImage(
      solutionImage.imageId,
      solutionImage.adminId,
      solutionImage.url,
      solutionImage.anotherUrl,
      solutionImage.mimeType,
      solutionImage.storageProvider,
      solutionImage.createdAt,
      solutionImage.updatedAt,
    )
  }

  async findByUrl(url: string): Promise<SolutionImage | null> {
    const solutionImage = await this.prisma.solutionImage.findUnique({
      where: { url },
    })

    if (!solutionImage) return null

    return new SolutionImage(
      solutionImage.imageId,
      solutionImage.adminId,
      solutionImage.url,
      solutionImage.anotherUrl,
      solutionImage.mimeType,
      solutionImage.storageProvider,
      solutionImage.createdAt,
      solutionImage.updatedAt,
    )
  }

  async findByAdmin(adminId: number): Promise<SolutionImage[]> {
    const solutionImages = await this.prisma.solutionImage.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    })

    return solutionImages.map(
      (si) =>
        new SolutionImage(
          si.imageId,
          si.adminId,
          si.url,
          si.anotherUrl,
          si.mimeType,
          si.storageProvider,
          si.createdAt,
          si.updatedAt,
        ),
    )
  }

  async update(id: number, data: Partial<CreateSolutionImageData>): Promise<SolutionImage> {
    const solutionImage = await this.prisma.solutionImage.update({
      where: { imageId: id },
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
      },
    })

    return new SolutionImage(
      solutionImage.imageId,
      solutionImage.adminId,
      solutionImage.url,
      solutionImage.anotherUrl,
      solutionImage.mimeType,
      solutionImage.storageProvider,
      solutionImage.createdAt,
      solutionImage.updatedAt,
    )
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.solutionImage.delete({
        where: { imageId: id },
      })
      return true
    } catch (error) {
      return false
    }
  }
}
