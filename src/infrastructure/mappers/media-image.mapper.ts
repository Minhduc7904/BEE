import { MediaImage } from '../../domain/entities'
import { AdminMapper } from '../mappers'
import { MediaImageResponseDto } from '../../application/dtos'

/**
 * Mapper class để convert giữa Prisma MediaImage models,
 * Domain MediaImage entities và DTOs
 */
export class MediaImageMapper {
    // Prisma → Domain
    static toDomainMediaImage(prismaMediaImage: any): MediaImage | null {
        if (!prismaMediaImage) return null

        return new MediaImage(
            prismaMediaImage.imageId,
            prismaMediaImage.url,
            prismaMediaImage.adminId ?? undefined,
            prismaMediaImage.admin
                ? AdminMapper.toDomainAdmin(prismaMediaImage.admin)
                : undefined,
            prismaMediaImage.anotherUrl ?? undefined,
            prismaMediaImage.caption ?? undefined,
            prismaMediaImage.mimeType ?? undefined,
            prismaMediaImage.storageProvider,
            prismaMediaImage.createdAt,
            prismaMediaImage.updatedAt,
        )
    }

    static toDomainMediaImages(prismaMediaImages: any[]): MediaImage[] {
        return prismaMediaImages
            .map((img) => this.toDomainMediaImage(img))
            .filter((img): img is MediaImage => img !== null)
    }

    // Domain → DTO
    static toResponseDto(image: MediaImage): MediaImageResponseDto {
        return {
            imageId: image.imageId,
            adminId: image.adminId || undefined,
            url: image.url,
            anotherUrl: image.anotherUrl || undefined,
            caption: image.caption || undefined,
            mimeType: image.mimeType || undefined,
            storageProvider: image.storageProvider,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
        }
    }

    static toResponseDtos(images: MediaImage[]): MediaImageResponseDto[] {
        return images.map((img) => this.toResponseDto(img))
    }
}
