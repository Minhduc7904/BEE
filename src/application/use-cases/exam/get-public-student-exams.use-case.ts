import { Inject, Injectable } from '@nestjs/common'
import type { IExamAttemptRepository, IExamRepository, IMediaUsageRepository } from '../../../domain/repositories'
import {
    ExamResponseDto,
    PublicStudentExamAttemptStatus,
    PublicStudentExamListQueryDto,
    PublicStudentExamListResponseDto,
} from '../../dtos/exam'
import { ExamVisibility, MediaStatus } from '../../../shared/enums'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { EXAM_CONTENT_FIELDS, EXAM_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { MinioService } from 'src/application/interfaces'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'

const EXAM_IMAGE_URL_EXPIRY_SECONDS = 3600 * 24

@Injectable()
export class GetPublicStudentExamsUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('IExamAttemptRepository')
        private readonly examAttemptRepository: IExamAttemptRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
        private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    ) { }

    async execute(
        query: PublicStudentExamListQueryDto,
        studentId?: number,
        options?: { renderDescriptionHtml?: boolean; expirySeconds?: number },
    ): Promise<PublicStudentExamListResponseDto> {
        const filters = {
            subjectId: query.subjectId,
            grade: query.grade,
            typeOfExam: query.typeOfExam,
            chapterIds: query.chapterIds,
            visibility: ExamVisibility.PUBLISHED,
            search: query.search,
        }

        const pagination = {
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
        }

        const result = await this.examRepository.findAllWithPagination(pagination, filters)
        const items = ExamResponseDto.fromEntities(result.exams)

        if (items.length > 0) {
            const examIds = items.map((item) => item.examId)
            const thumbnailUsages = await this.mediaUsageRepository.findByEntities(
                EntityType.EXAM,
                examIds,
                EXAM_MEDIA_FIELDS.EXAM_IMAGE,
            )

            const usageMap = new Map<number, typeof thumbnailUsages[number]>()
            for (const usage of thumbnailUsages) {
                if (!usageMap.has(usage.entityId)) {
                    usageMap.set(usage.entityId, usage)
                }
            }

            for (const item of items) {
                const usage = usageMap.get(item.examId)
                const media = usage?.media
                if (!media || media.status !== MediaStatus.READY) {
                    continue
                }

                if (media.publicUrl) {
                    item.thumbnailUrl = media.publicUrl
                    continue
                }

                try {
                    item.thumbnailUrl = await this.minioService.getPresignedUrl(
                        media.bucketName,
                        media.objectKey,
                        EXAM_IMAGE_URL_EXPIRY_SECONDS,
                    )
                } catch {
                    // Silently ignore - thumbnail is optional
                }
            }
        }

        if (options?.renderDescriptionHtml && items.length > 0) {
            const expirySeconds = options.expirySeconds ?? 3600
            for (const item of items) {
                if (!item.description) {
                    continue
                }

                const contentFields: ContentField[] = [
                    { fieldName: EXAM_CONTENT_FIELDS.DESCRIPTION, content: item.description },
                ]

                const processedResults = await this.processContentAndRenderHtmlUseCase.execute(
                    contentFields,
                    expirySeconds,
                )

                item.processedDescription = this.processContentAndRenderHtmlUseCase.getProcessedContent(
                    processedResults,
                    EXAM_CONTENT_FIELDS.DESCRIPTION,
                ) || item.description
            }
        }

        if (studentId && items.length > 0) {
            const examIds = items.map((item) => item.examId)
            const submittedExamIds = await this.examAttemptRepository.findSubmittedExamIdsByStudent(
                studentId,
                examIds,
            )
            const submittedExamIdSet = new Set(submittedExamIds)

            for (const item of items) {
                item.attemptStatus = submittedExamIdSet.has(item.examId)
                    ? PublicStudentExamAttemptStatus.ATTEMPTED
                    : PublicStudentExamAttemptStatus.NOT_ATTEMPTED
            }
        }

        return PublicStudentExamListResponseDto.fromResult(
            items,
            result.page,
            result.limit,
            result.total,
        )
    }
}
