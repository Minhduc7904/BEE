import { Injectable } from '@nestjs/common';
import { 
  IMediaImageRepository, 
  CreateMediaImageData 
} from '../../domain/repositories/media-image.repository';
import { MediaImage } from '../../domain/entities/image/media-image.entity';

@Injectable()
export class PrismaMediaImageRepository implements IMediaImageRepository {
  constructor(
    private readonly prisma: any, // PrismaService or TransactionClient 
  ) {}

  async create(data: CreateMediaImageData): Promise<MediaImage> {
    const mediaImage = await this.prisma.mediaImage.create({
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
        adminId: data.adminId,
      },
    });

    return new MediaImage(
      mediaImage.imageId,
      mediaImage.adminId,
      mediaImage.url,
      mediaImage.anotherUrl,
      mediaImage.mimeType,
      mediaImage.storageProvider,
      mediaImage.createdAt,
      mediaImage.updatedAt
    );
  }

  async findById(id: number): Promise<MediaImage | null> {
    const mediaImage = await this.prisma.mediaImage.findUnique({
      where: { imageId: id },
    });

    if (!mediaImage) return null;

    return new MediaImage(
      mediaImage.imageId,
      mediaImage.adminId,
      mediaImage.url,
      mediaImage.anotherUrl,
      mediaImage.mimeType,
      mediaImage.storageProvider,
      mediaImage.createdAt,
      mediaImage.updatedAt
    );
  }

  async findByUrl(url: string): Promise<MediaImage | null> {
    const mediaImage = await this.prisma.mediaImage.findUnique({
      where: { url },
    });

    if (!mediaImage) return null;

    return new MediaImage(
      mediaImage.imageId,
      mediaImage.adminId,
      mediaImage.url,
      mediaImage.anotherUrl,
      mediaImage.mimeType,
      mediaImage.storageProvider,
      mediaImage.createdAt,
      mediaImage.updatedAt
    );
  }

  async findByAdmin(adminId: number): Promise<MediaImage[]> {
    const mediaImages = await this.prisma.mediaImage.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    });

    return mediaImages.map(mi => new MediaImage(
      mi.imageId,
      mi.adminId,
      mi.url,
      mi.anotherUrl,
      mi.mimeType,
      mi.storageProvider,
      mi.createdAt,
      mi.updatedAt
    ));
  }

  async update(id: number, data: Partial<CreateMediaImageData>): Promise<MediaImage> {
    const mediaImage = await this.prisma.mediaImage.update({
      where: { imageId: id },
      data: {
        url: data.url,
        anotherUrl: data.anotherUrl,
        mimeType: data.mimeType,
        storageProvider: data.storageProvider,
      },
    });

    return new MediaImage(
      mediaImage.imageId,
      mediaImage.adminId,
      mediaImage.url,
      mediaImage.anotherUrl,
      mediaImage.mimeType,
      mediaImage.storageProvider,
      mediaImage.createdAt,
      mediaImage.updatedAt
    );
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.mediaImage.delete({
        where: { imageId: id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
