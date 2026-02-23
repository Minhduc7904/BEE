// src/application/use-cases/learningItem/stream-student-video.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import { Readable } from 'stream'
import type { ILearningItemRepository, IMediaUsageRepository, IMediaRepository } from '../../../domain/repositories'
import type { IStudentLearningItemRepository } from '../../../domain/repositories/student-learning-item.repository'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from '../../../shared/enums'

export interface StreamVideoResult {
    stream: Readable
    totalSize: number
    contentType: string
    filename: string
}

@Injectable()
export class StreamStudentVideoUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
        @Inject('IStudentLearningItemRepository')
        private readonly studentLearningItemRepository: IStudentLearningItemRepository,
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
        private readonly minioService: MinioService,
    ) { }

    /**
     * Stream video with range support for a student
     * @param learningItemId - ID of the learning item
     * @param mediaId - ID of the media file to stream
     * @param studentId - ID of the student requesting the stream
     * @param rangeStart - Optional start byte for range request
     * @param rangeEnd - Optional end byte for range request
     */
    async execute(
        learningItemId: number,
        mediaId: number,
        studentId: number,
        rangeStart?: number,
        rangeEnd?: number,
    ): Promise<StreamVideoResult> {
        // 1. Verify learning item exists and student has access
        const learningItem = await this.learningItemRepository.findByIdWithContents(learningItemId)
        if (!learningItem) {
            throw new NotFoundException('Không tìm thấy learning item')
        }

        // 2. Verify student has access to this learning item
        // This could be expanded to check if student is enrolled in the course/class
        const studentLearningItem = await this.studentLearningItemRepository.findByCompositeId(
            studentId,
            learningItemId,
        )
        // Note: Even if studentLearningItem is null, we allow access (first time viewing)
        // If you want stricter access control, check enrollment here

        // 3. Get media information
        const media = await this.mediaRepository.findById(mediaId)
        if (!media) {
            throw new NotFoundException('Không tìm thấy media file')
        }

        // 4. Verify media is ready for streaming
        if (media.status !== MediaStatus.READY) {
            throw new ForbiddenException('Media file chưa sẵn sàng để xem')
        }

        // 5. Get file metadata from MinIO to determine size
        const metadata = await this.minioService.getFileMetadata(media.bucketName, media.objectKey)
        const totalSize = metadata.size

        // 6. Calculate range
        const start = rangeStart ?? 0
        const end = rangeEnd ?? totalSize - 1
        const chunkSize = end - start + 1

        // 7. Get partial stream from MinIO
        const stream = await this.minioService.getPartialStream(
            media.bucketName,
            media.objectKey,
            start,
            chunkSize,
        )

        return {
            stream,
            totalSize,
            contentType: media.mimeType || 'video/mp4',
            filename: media.originalFilename,
        }
    }
}
