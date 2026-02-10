// src/application/use-cases/documentContent/get-all-document-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IDocumentContentRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { DocumentContentListQueryDto } from '../../dtos/documentContent/document-content-list-query.dto'
import { DocumentContentListResponseDto, DocumentContentResponseDto, MediaFileDto } from '../../dtos/documentContent/document-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { FIELD_NAMES } from 'src/shared/constants'
import { MediaStatus } from 'src/shared/enums'

@Injectable()
export class GetAllDocumentContentUseCase {
    constructor(
        @Inject('IDocumentContentRepository')
        private readonly documentContentRepository: IDocumentContentRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(query: DocumentContentListQueryDto): Promise<DocumentContentListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            learningItemId: query.learningItemId,
            search: query.search,
        }

        const result = await this.documentContentRepository.findAllWithPagination(pagination, filters)

        // Get media usages for all document contents
        const documentContentDtos = await Promise.all(
            result.documentContents.map(async (item) => {
                // Get media usages for this document content
                const mediaUsages = await this.mediaUsageRepository.findByEntity(
                    EntityType.DOCUMENT_CONTENT,
                    item.documentContentId,
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

                return DocumentContentResponseDto.fromEntity(item, mediaFiles)
            }),
        )

        return BaseResponseDto.success(
            'Document contents retrieved successfully',
            {
                documentContents: documentContentDtos,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            },
        )
    }
}
