import { Injectable } from '@nestjs/common'
import { IQuestionImageRepository, CreateQuestionImageData } from '../../domain/repositories'
import { QuestionImage } from '../../domain/entities'
import { QuestionImageMapper } from '../mappers'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaQuestionImageRepository implements IQuestionImageRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client


  async create(data: CreateQuestionImageData): Promise<QuestionImage> {
    const questionImage = await this.prisma.questionImage.create({
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        caption: data.caption,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        adminId: data.adminId,
      },
      include: { admin: true },
    })

    return QuestionImageMapper.toDomainQuestionImage(questionImage)!
  }

  async findById(id: number): Promise<QuestionImage | null> {
    const questionImage = await this.prisma.questionImage.findUnique({
      where: { imageId: id },
      include: { admin: true },
    })

    return QuestionImageMapper.toDomainQuestionImage(questionImage)
  }

  async findByUrl(url: string): Promise<QuestionImage | null> {
    const questionImage = await this.prisma.questionImage.findUnique({
      where: { url },
      include: { admin: true },
    })

    return QuestionImageMapper.toDomainQuestionImage(questionImage)
  }

  async findByAdmin(adminId: number): Promise<QuestionImage[]> {
    const questionImages = await this.prisma.questionImage.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    })

    return QuestionImageMapper.toDomainQuestionImages(questionImages)
  }

  async update(id: number, data: Partial<CreateQuestionImageData>): Promise<QuestionImage> {
    const questionImage = await this.prisma.questionImage.update({
      where: { imageId: id },
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        caption: data.caption,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
      },
      include: { admin: true },
    })

    return QuestionImageMapper.toDomainQuestionImage(questionImage)!
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.questionImage.delete({
        where: { imageId: id },
      })
      return true
    } catch {
      return false
    }
  }
}
