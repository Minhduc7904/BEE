import { Injectable } from '@nestjs/common';
import { 
  IQuestionImageRepository, 
  CreateQuestionImageData 
} from '../../domain/repositories/question-image.repository';
import { QuestionImage } from '../../domain/entities/image/question-image.entity';

@Injectable()
export class PrismaQuestionImageRepository implements IQuestionImageRepository {
  constructor(
    private readonly prisma: any, // PrismaService or TransactionClient 
  ) {}

  async create(data: CreateQuestionImageData): Promise<QuestionImage> {
    const questionImage = await this.prisma.questionImage.create({
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        adminId: data.adminId,
      },
    });

    return new QuestionImage(
      questionImage.imageId,
      questionImage.adminId,
      questionImage.url,
      questionImage.anotherUrl,
      questionImage.mimeType,
      questionImage.storageProvider,
      questionImage.relatedType,
      questionImage.relatedId,
      questionImage.createdAt,
      questionImage.updatedAt
    );
  }

  async findById(id: number): Promise<QuestionImage | null> {
    const questionImage = await this.prisma.questionImage.findUnique({
      where: { imageId: id },
    });

    if (!questionImage) return null;

    return new QuestionImage(
      questionImage.imageId,
      questionImage.adminId,
      questionImage.url,
      questionImage.anotherUrl,
      questionImage.mimeType,
      questionImage.storageProvider,
      questionImage.relatedType,
      questionImage.relatedId,
      questionImage.createdAt,
      questionImage.updatedAt
    );
  }

  async findByUrl(url: string): Promise<QuestionImage | null> {
    const questionImage = await this.prisma.questionImage.findUnique({
      where: { url },
    });

    if (!questionImage) return null;

    return new QuestionImage(
      questionImage.imageId,
      questionImage.adminId,
      questionImage.url,
      questionImage.anotherUrl,
      questionImage.mimeType,
      questionImage.storageProvider,
      questionImage.relatedType,
      questionImage.relatedId,
      questionImage.createdAt,
      questionImage.updatedAt
    );
  }

  async findByAdmin(adminId: number): Promise<QuestionImage[]> {
    const questionImages = await this.prisma.questionImage.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    });

    return questionImages.map(qi => new QuestionImage(
      qi.imageId,
      qi.adminId,
      qi.url,
      qi.anotherUrl,
      qi.mimeType,
      qi.storageProvider,
      qi.relatedType,
      qi.relatedId,
      qi.createdAt,
      qi.updatedAt
    ));
  }

  async update(id: number, data: Partial<CreateQuestionImageData>): Promise<QuestionImage> {
    const questionImage = await this.prisma.questionImage.update({
      where: { imageId: id },
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
      },
    });

    return new QuestionImage(
      questionImage.imageId,
      questionImage.adminId,
      questionImage.url,
      questionImage.anotherUrl,
      questionImage.mimeType,
      questionImage.storageProvider,
      questionImage.relatedType,
      questionImage.relatedId,
      questionImage.createdAt,
      questionImage.updatedAt
    );
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.questionImage.delete({
        where: { imageId: id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
