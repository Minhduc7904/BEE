// src/infrastructure/mappers/image.mapper.ts
import { Image } from '../../domain/entities'
import { AdminMapper } from '../mappers'
import { ImageResponseDto } from '../../application/dtos'

/**
 * Mapper class để convert giữa Prisma Image models,
 * Domain Image entities và DTOs
 */
export class ImageMapper {
    // Prisma → Domain
    static toDomainImage(prismaImage: any): Image | null {
        if (!prismaImage) return null

        return new Image(
            prismaImage.imageId,
            prismaImage.url,
            prismaImage.adminId ?? undefined,
            prismaImage.admin
                ? AdminMapper.toDomainAdmin(prismaImage.admin)
                : undefined,
            prismaImage.anotherUrl ?? undefined,
            prismaImage.caption ?? undefined,
            prismaImage.mimeType ?? undefined,
            prismaImage.storageProvider,
            prismaImage.createdAt,
            prismaImage.updatedAt,
        )
    }

    static toDomainImages(prismaImages: any[]): Image[] {
        return prismaImages
            .map((img) => this.toDomainImage(img))
            .filter((img): img is Image => img !== null)
    }

    // Domain → DTO
    static toResponseDto(image: Image): ImageResponseDto {
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

    static toResponseDtos(images: Image[]): ImageResponseDto[] {
        return images.map((img) => this.toResponseDto(img))
    }
}
