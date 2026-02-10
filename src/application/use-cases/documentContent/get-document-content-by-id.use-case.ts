// src/application/use-cases/documentContent/get-document-content-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IDocumentContentRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { DocumentContentResponseDto, MediaFileDto } from '../../dtos/documentContent/document-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { FIELD_NAMES } from 'src/shared/constants'
import { MediaStatus } from 'src/shared/enums'

@Injectable()
export class GetDocumentContentByIdUseCase {
    constructor(
        @Inject('IDocumentContentRepository')
        private readonly documentContentRepository: IDocumentContentRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<DocumentContentResponseDto>> {
        const documentContent = await this.documentContentRepository.findById(id)

        if (!documentContent) {
            throw new NotFoundException(`Document content with ID ${id} not found`)
        }

        // Get media usages for this document content
        const mediaUsages = await this.mediaUsageRepository.findByEntity(
            EntityType.DOCUMENT_CONTENT,
            id,
            FIELD_NAMES.DOCUMENT_FILE,
        )

        // Generate viewUrl for each media
        const mediaFiles: MediaFileDto[] = await Promise.all(
            mediaUsages.map(async (usage) => {
                const media = usage.media
                if (!media) {
                    return null
                }

                const mediaFile: MediaFileDto = {
                    mediaId: media.mediaId,
                    filename: media.originalFilename,
                    type: media.type,
                }

                // Generate viewUrl if media is ready
                if (media.status === MediaStatus.READY) {
                    try {
                        const viewUrl = await this.minioService.getPresignedUrl(
                            media.bucketName,
                            media.objectKey,
                            3600, // 1 hour expiry
                        )
                        mediaFile.viewUrl = viewUrl
                    } catch (error) {
                        console.error(`Failed to generate viewUrl for media ${media.mediaId}:`, error)
                    }
                }

                return mediaFile
            }),
        ).then(files => files.filter(f => f !== null) as MediaFileDto[])

        const dto = DocumentContentResponseDto.fromEntity(documentContent, mediaFiles)
        return BaseResponseDto.success('Document content retrieved successfully', dto)
    }
}
