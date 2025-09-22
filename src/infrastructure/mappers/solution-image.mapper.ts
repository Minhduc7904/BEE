import { SolutionImage } from '../../domain/entities'
import { AdminMapper } from '../mappers'
import { SolutionImageResponseDto } from '../../application/dtos'

/**
 * Mapper class để convert giữa Prisma SolutionImage models,
 * Domain SolutionImage entities và DTOs
 */
export class SolutionImageMapper {
    // Prisma → Domain
    static toDomainSolutionImage(prismaSolutionImage: any): SolutionImage | null {
        if (!prismaSolutionImage) return null

        return new SolutionImage(
            prismaSolutionImage.imageId,
            prismaSolutionImage.url,
            prismaSolutionImage.adminId ?? undefined,
            prismaSolutionImage.admin
                ? AdminMapper.toDomainAdmin(prismaSolutionImage.admin)
                : undefined,
            prismaSolutionImage.anotherUrl ?? undefined,
            prismaSolutionImage.caption ?? undefined,
            prismaSolutionImage.mimeType ?? undefined,
            prismaSolutionImage.storageProvider,
            prismaSolutionImage.createdAt,
            prismaSolutionImage.updatedAt,
        )
    }

    static toDomainSolutionImages(prismaSolutionImages: any[]): SolutionImage[] {
        return prismaSolutionImages
            .map((img) => this.toDomainSolutionImage(img))
            .filter((img): img is SolutionImage => img !== null)
    }

    // Domain → DTO
    static toResponseDto(image: SolutionImage): SolutionImageResponseDto {
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

    static toResponseDtos(images: SolutionImage[]): SolutionImageResponseDto[] {
        return images.map((img) => this.toResponseDto(img))
    }
}
