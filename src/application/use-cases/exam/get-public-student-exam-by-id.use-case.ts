import { Inject, Injectable } from '@nestjs/common'
import type { IExamAttemptRepository, IExamRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    PublicStudentExamAttemptStatus,
    PublicStudentExamDetailResponseDto,
} from '../../dtos/exam/exam.dto'
import { ExamVisibility, MediaStatus } from '../../../shared/enums'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { EXAM_CONTENT_FIELDS, EXAM_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../shared/constants'

const AVATAR_URL_EXPIRY_SECONDS = 3600 * 24
const EXAM_IMAGE_URL_EXPIRY_SECONDS = 3600 * 24

@Injectable()
export class GetPublicStudentExamByIdUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('IExamAttemptRepository')
        private readonly examAttemptRepository: IExamAttemptRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
        private readonly minioService: MinioService,
    ) { }

    async execute(
        examId: number,
        studentId?: number,
        expirySeconds = 3600,
    ): Promise<BaseResponseDto<PublicStudentExamDetailResponseDto>> {
        const exam = await this.examRepository.findById(examId)

        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        if (exam.visibility !== ExamVisibility.PUBLISHED) {
            throw new ForbiddenException('Chỉ được xem chi tiết đề thi public')
        }

        const examResponse = PublicStudentExamDetailResponseDto.fromEntity(exam)

        if (studentId) {
            const hasSubmitted = await this.examAttemptRepository.hasSubmittedExamByStudent(
                studentId,
                examId,
            )
            examResponse.attemptStatus = hasSubmitted
                ? PublicStudentExamAttemptStatus.ATTEMPTED
                : PublicStudentExamAttemptStatus.NOT_ATTEMPTED
        }

        const createdByUserId = exam.admin?.user?.userId
        if (createdByUserId && examResponse.createdByAdmin) {
            const avatarUsages = await this.mediaUsageRepository.findByEntity(
                EntityType.USER,
                createdByUserId,
                USER_MEDIA_FIELDS.AVATAR,
            )

            if (avatarUsages.length > 0) {
                const media = avatarUsages[0].media
                if (media && media.status === MediaStatus.READY) {
                    try {
                        const avatarUrl = await this.minioService.getPresignedUrl(
                            media.bucketName,
                            media.objectKey,
                            AVATAR_URL_EXPIRY_SECONDS,
                        )
                        examResponse.createdByAdmin.avatarUrl = avatarUrl
                    } catch {
                        // Silently ignore - avatar URL is optional
                    }
                }
            }
        }

        const examImageUsages = await this.mediaUsageRepository.findByEntity(
            EntityType.EXAM,
            exam.examId,
            EXAM_MEDIA_FIELDS.EXAM_IMAGE,
        )

        const examImageUsage = examImageUsages.find((usage) => usage.media?.status === MediaStatus.READY)
        if (examImageUsage?.media) {
            if (examImageUsage.media.publicUrl) {
                examResponse.thumbnailUrl = examImageUsage.media.publicUrl
            } else {
                try {
                    examResponse.thumbnailUrl = await this.minioService.getPresignedUrl(
                        examImageUsage.media.bucketName,
                        examImageUsage.media.objectKey,
                        EXAM_IMAGE_URL_EXPIRY_SECONDS,
                    )
                } catch {
                    // Silently ignore - thumbnail is optional
                }
            }
        }

        if (examResponse.description) {
            const contentFields: ContentField[] = [
                { fieldName: EXAM_CONTENT_FIELDS.DESCRIPTION, content: examResponse.description },
            ]

            const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)
            examResponse.processedDescription = this.processContentAndRenderHtmlUseCase.getProcessedContent(
                processedResults,
                EXAM_CONTENT_FIELDS.DESCRIPTION,
            ) || examResponse.description
        }

        return BaseResponseDto.success('Lấy chi tiết đề thi public thành công', examResponse)
    }
}
