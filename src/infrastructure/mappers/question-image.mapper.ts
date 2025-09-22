// src/infrastructure/mappers/question-image.mapper.ts
import { QuestionImage } from '../../domain/entities'
import { AdminMapper } from '../mappers'
import { QuestionImageResponseDto } from '../../application/dtos'

/**
 * Mapper class để convert giữa Prisma QuestionImage models,
 * Domain QuestionImage entities và DTOs
 */
export class QuestionImageMapper {
    // Prisma → Domain
    static toDomainQuestionImage(prismaQuestionImage: any): QuestionImage | null {
        if (!prismaQuestionImage) return null

        return new QuestionImage(
            prismaQuestionImage.imageId,
            prismaQuestionImage.url,
            prismaQuestionImage.adminId ?? undefined,
            prismaQuestionImage.admin
                ? AdminMapper.toDomainAdmin(prismaQuestionImage.admin)
                : undefined,
            prismaQuestionImage.anotherUrl ?? undefined,
            prismaQuestionImage.caption ?? undefined,
            prismaQuestionImage.mimeType ?? undefined,
            prismaQuestionImage.storageProvider,
            prismaQuestionImage.relatedType ?? undefined,
            prismaQuestionImage.relatedId ?? undefined,
            prismaQuestionImage.createdAt,
            prismaQuestionImage.updatedAt,
        )

    }

    static toDomainQuestionImages(prismaQuestionImages: any[]): QuestionImage[] {
        return prismaQuestionImages
            .map((img) => this.toDomainQuestionImage(img))
            .filter((img): img is QuestionImage => img !== null)
    }

    // Domain → DTO
    static toResponseDto(image: QuestionImage): QuestionImageResponseDto {
        return {
            imageId: image.imageId,
            adminId: image.adminId || undefined,
            url: image.url,
            anotherUrl: image.anotherUrl || undefined,
            caption: image.caption || undefined,
            mimeType: image.mimeType || undefined,
            storageProvider: image.storageProvider,
            relatedType: image.relatedType || undefined,
            relatedId: image.relatedId || undefined,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
        }
    }

    static toResponseDtos(images: QuestionImage[]): QuestionImageResponseDto[] {
        return images.map((img) => this.toResponseDto(img))
    }
}
