// src/application/use-cases/learningItem/get-student-learning-item-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type {
    ILearningItemRepository,
    IMediaUsageRepository,
    IHomeworkSubmitRepository,
    ICompetitionSubmitRepository,
    IExamRepository,
} from '../../../domain/repositories'
import type { IStudentLearningItemRepository } from '../../../domain/repositories/student-learning-item.repository'
import type { CompetitionSubmit } from '../../../domain/entities'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentLearningItemResponseDto, HomeworkProgressDto } from '../../dtos/learningItem/student-learning-item.dto'
import { MediaFileDto } from '../../dtos/documentContent/document-content.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from 'src/application/interfaces'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { DOCUMENT_MEDIA_FIELDS, VIDEO_MEDIA_FIELDS } from '../../../shared/constants'
import { CompetitionSubmitStatus, LearningItemType, MediaStatus } from '../../../shared/enums'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

@Injectable()
export class GetStudentLearningItemByIdUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
        @Inject('IStudentLearningItemRepository')
        private readonly studentLearningItemRepository: IStudentLearningItemRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        private readonly minioService: MinioService,
        private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
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

        const accessibleLessonLearningItem =
            await this.studentClassLessonAccessService.findAccessibleLessonForLearningItem(
                learningItemId,
                studentId,
            )

        if (!accessibleLessonLearningItem) {
            throw new NotFoundException('Không tìm thấy learning item')
        }

        // 2. Lấy student learning item progress
        const studentLearningItem = await this.studentLearningItemRepository.findByCompositeId(
            studentId,
            learningItemId,
        )

        // 3. Xử lý đặc biệt cho HOMEWORK type - tạo progress cho từng homeworkContent
        const homeworkProgressMap = new Map<number, HomeworkProgressDto>()

        if (learningItem.type === LearningItemType.HOMEWORK && learningItem.homeworkContents?.length) {
            // Xử lý từng homework content
            for (const homeworkContent of learningItem.homeworkContents) {
                // Lấy homework submit của student cho content này
                const homeworkSubmit = await this.homeworkSubmitRepository.findByHomeworkAndStudent(
                    homeworkContent.homeworkContentId,
                    studentId,
                )

                // Khởi tạo các biến
                let latestCompetitionSubmit: CompetitionSubmit | null = null
                let submittedAttemptCount = 0
                let questionCount: number | undefined
                let startDate: Date | undefined
                let endDate: Date | undefined
                let maxAttempts: number | undefined

                // Nếu có competition, lấy thêm thông tin
                if (homeworkContent.competitionId) {
                    // Chỉ tải submit mới nhất (không include answers/relations) và COUNT lượt đã nộp.
                    // Trước đây API tải toàn bộ lịch sử submit kèm answers nên response bị lặp và chậm.
                    const [latestSubmit, attemptCount, competitionQuestionCount] = await Promise.all([
                        this.competitionSubmitRepository.findLatestAttempt(
                            homeworkContent.competitionId,
                            studentId,
                            undefined,
                            { includeRelations: false },
                        ),
                        this.competitionSubmitRepository.count({
                            competitionId: homeworkContent.competitionId,
                            studentId,
                            status: CompetitionSubmitStatus.SUBMITTED,
                        }),
                        homeworkContent.competition?.examId
                            ? this.examRepository.countQuestionsByExamId(homeworkContent.competition.examId)
                            : Promise.resolve(undefined),
                    ])
                    latestCompetitionSubmit = latestSubmit
                    submittedAttemptCount = attemptCount
                    questionCount = competitionQuestionCount

                    // Lấy cấu hình competition đã được nạp cùng homework content.
                    if (homeworkContent.competition) {
                        startDate = homeworkContent.competition.startDate ?? undefined
                        endDate = homeworkContent.competition.endDate ?? undefined
                        maxAttempts = homeworkContent.competition.maxAttempts ?? undefined
                    }
                }

                // Tạo HomeworkProgressDto cho content này
                const progress = HomeworkProgressDto.create({
                    studentLearningItem,
                    homeworkSubmit,
                    latestCompetitionSubmit,
                    submittedAttemptCount,
                    questionCount,
                    dueDate: homeworkContent.dueDate ?? undefined,
                    startDate,
                    endDate,
                    maxAttempts,
                    allowLateSubmit: homeworkContent.allowLateSubmit,
                    allowViewScore: homeworkContent.competition?.allowViewScore ?? true,
                })

                // Lưu vào map
                homeworkProgressMap.set(homeworkContent.homeworkContentId, progress)
            }
        }

        // 4. Lấy media files cho VIDEO và DOCUMENT content
        const mediaFilesMap = new Map<number, MediaFileDto[]>()

        // Xử lý VIDEO content - Sử dụng streaming URL thay vì presigned URL
        if (learningItem.type === LearningItemType.VIDEO && learningItem.videoContents) {
            for (const videoContent of learningItem.videoContents) {
                const mediaFiles = await this.getMediaFilesForEntity(
                    EntityType.VIDEO_CONTENT,
                    videoContent.videoContentId,
                    VIDEO_MEDIA_FIELDS.VIDEO_FILE,
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
                    DOCUMENT_MEDIA_FIELDS.DOCUMENT_FILE,
                    false, // isVideoStreaming = false
                )
                mediaFilesMap.set(documentContent.documentContentId, mediaFiles)
            }
        }

        // 5. Map to response DTO with media files and homework progress map
        const response = StudentLearningItemResponseDto.fromEntity(
            learningItem,
            studentLearningItem,
            mediaFilesMap,
            homeworkProgressMap,
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
        ).then(files => files.filter(f => f !== null))

        return mediaFiles
    }
}
