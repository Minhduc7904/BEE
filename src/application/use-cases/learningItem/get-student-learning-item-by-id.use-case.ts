// src/application/use-cases/learningItem/get-student-learning-item-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILearningItemRepository, IMediaUsageRepository } from '../../../domain/repositories'
import type { IStudentLearningItemRepository } from '../../../domain/repositories/student-learning-item.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentLearningItemResponseDto } from '../../dtos/learningItem/student-learning-item.dto'
import { MediaFileDto } from '../../dtos/documentContent/document-content.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { FIELD_NAMES } from '../../../shared/constants'
import { MediaStatus } from '../../../shared/enums'
import { LearningItemType } from '../../../shared/enums'

@Injectable()
export class GetStudentLearningItemByIdUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
        @Inject('IStudentLearningItemRepository')
        private readonly studentLearningItemRepository: IStudentLearningItemRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(
        learningItemId: number,
        studentId: number,
    ): Promise<BaseResponseDto<StudentLearningItemResponseDto>> {
        // 1. Lấy learning item với content
        const learningItem = await this.learningItemRepository.findByIdWithContents(learningItemId)

        if (!learningItem) {
            throw new NotFoundException('Không tìm thấy learning item')
        }

        // 2. Lấy student learning item progress
        const studentLearningItem = await this.studentLearningItemRepository.findByCompositeId(
            studentId,
            learningItemId,
        )

        // 3. Lấy media files cho VIDEO và DOCUMENT content
        const mediaFilesMap = new Map<number, MediaFileDto[]>()

        // Xử lý VIDEO content - Sử dụng streaming URL thay vì presigned URL
        if (learningItem.type === LearningItemType.VIDEO && learningItem.videoContents) {
            for (const videoContent of learningItem.videoContents) {
                const mediaFiles = await this.getMediaFilesForEntity(
                    EntityType.VIDEO_CONTENT,
                    videoContent.videoContentId,
                    FIELD_NAMES.VIDEO_FILE,
                    true, // isVideoStreaming = true
                    learningItemId, // Pass learningItemId để tạo streaming URL
                )
                mediaFilesMap.set(videoContent.videoContentId, mediaFiles)
            }
        }

        // Xử lý DOCUMENT content - Vẫn sử dụng presigned URL
        if (learningItem.type === LearningItemType.DOCUMENT && learningItem.documentContents) {
            for (const documentContent of learningItem.documentContents) {
                const mediaFiles = await this.getMediaFilesForEntity(
                    EntityType.DOCUMENT_CONTENT,
                    documentContent.documentContentId,
                    FIELD_NAMES.DOCUMENT_FILE,
                    false, // isVideoStreaming = false
                )
                mediaFilesMap.set(documentContent.documentContentId, mediaFiles)
            }
        }

        // 4. Map to response DTO with media files
        const response = StudentLearningItemResponseDto.fromEntity(
            learningItem,
            studentLearningItem,
            mediaFilesMap,
        )

        return {
            success: true,
            message: 'Lấy thông tin learning item thành công',
            data: response,
        }
    }

    /**
     * Helper method để lấy media files cho một entity
     * @param entityType - Type của entity (VIDEO_CONTENT, DOCUMENT_CONTENT)
     * @param entityId - ID của entity
     * @param fieldName - Tên field (VIDEO_FILE, DOCUMENT_FILE)
     * @param isVideoStreaming - Nếu true, tạo streaming URL thay vì presigned URL
     * @param learningItemId - ID của learning item (cần cho streaming URL)
     */
    private async getMediaFilesForEntity(
        entityType: EntityType,
        entityId: number,
        fieldName: string,
        isVideoStreaming = false,
        learningItemId?: number,
    ): Promise<MediaFileDto[]> {
        const mediaUsages = await this.mediaUsageRepository.findByEntity(
            entityType,
            entityId,
            fieldName,
        )

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

                // Generate URL if media is ready
                if (media.status === MediaStatus.READY) {
                    try {
                        if (isVideoStreaming && learningItemId) {
                            // Tạo streaming URL cho video (relative URL)
                            // URL format: /api/learning-items/:id/student/video/stream/:mediaId
                            // Sử dụng relative URL để tương thích với mọi domain
                            mediaFile.viewUrl = `/api/learning-items/${learningItemId}/student/video/stream/${media.mediaId}`
                        } else {
                            // Tạo presigned URL từ MinIO cho documents và các file khác
                            const viewUrl = await this.minioService.getPresignedUrl(
                                media.bucketName,
                                media.objectKey,
                                3600, // 1 hour expiry
                            )
                            mediaFile.viewUrl = viewUrl
                        }
                    } catch (error) {
                        console.error(`Failed to generate viewUrl for media ${media.mediaId}:`, error)
                    }
                }

                return mediaFile
            }),
        ).then(files => files.filter(f => f !== null) as MediaFileDto[])

        return mediaFiles
    }
}
