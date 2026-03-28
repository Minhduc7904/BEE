import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { PublicStudentExamDetailResponseDto } from '../../dtos/exam/exam.dto'
import { ExamVisibility, MediaStatus } from '../../../shared/enums'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { EXAM_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { FIELD_NAMES } from '../../../shared/constants'

const AVATAR_URL_EXPIRY_SECONDS = 3600 * 24

@Injectable()
export class GetPublicStudentExamByIdUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
        private readonly minioService: MinioService,
    ) { }

    async execute(examId: number, expirySeconds = 3600): Promise<BaseResponseDto<PublicStudentExamDetailResponseDto>> {
        const exam = await this.examRepository.findById(examId)

        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        if (exam.visibility !== ExamVisibility.PUBLISHED) {
            throw new ForbiddenException('Chỉ được xem chi tiết đề thi public')
        }

        const examResponse = PublicStudentExamDetailResponseDto.fromEntity(exam)

        const createdByUserId = exam.admin?.user?.userId
        if (createdByUserId && examResponse.createdByAdmin) {
            const avatarUsages = await this.mediaUsageRepository.findByEntity(
                EntityType.USER,
                createdByUserId,
                FIELD_NAMES.AVATAR,
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
