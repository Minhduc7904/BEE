import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from '@prisma/client'
import { BaseResponseDto } from '../../dtos'

interface MediaViewUrlResult {
  mediaId: number
  viewUrl: string
  expiresAt: Date
  expirySeconds: number
  filename: string
  mimeType: string
  fileSize: number
  type: string
  error?: string
}

/**
 * GetBatchMediaViewUrlUseCase - Generate presigned URLs for viewing multiple media files
 * 
 * Processes multiple media IDs and generates view URLs for each valid media.
 * Handles errors gracefully by returning error messages for invalid media.
 */
@Injectable()
export class GetBatchMediaViewUrlUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    mediaIds: number[],
    expirySeconds: number = 3600, // 1 hour default
  ) {
    // Step 1: Fetch all media records
    const mediaRecords = await Promise.all(
      mediaIds.map(id => this.mediaRepository.findById(id)),
    )

    // Step 2: Process each media and generate URLs
    const results: MediaViewUrlResult[] = []
    const expiresAt = new Date(Date.now() + expirySeconds * 1000)

    for (let i = 0; i < mediaIds.length; i++) {
      const mediaId = mediaIds[i]
      const media = mediaRecords[i]

      // Handle not found
      if (!media) {
        results.push({
          mediaId,
          viewUrl: '',
          expiresAt,
          expirySeconds,
          filename: '',
          mimeType: '',
          fileSize: 0,
          type: '',
          error: `Media với ID ${mediaId} không tồn tại`,
        })
        continue
      }

      // Handle invalid status
      if (media.status === MediaStatus.UPLOADING) {
        results.push({
          mediaId,
          viewUrl: '',
          expiresAt,
          expirySeconds,
          filename: media.originalFilename,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
          type: media.type,
          error: 'Media đang được tải lên',
        })
        continue
      }

      if (media.status === MediaStatus.FAILED) {
        results.push({
          mediaId,
          viewUrl: '',
          expiresAt,
          expirySeconds,
          filename: media.originalFilename,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
          type: media.type,
          error: 'Tải lên media thất bại',
        })
        continue
      }

      if (media.status === MediaStatus.DELETED) {
        results.push({
          mediaId,
          viewUrl: '',
          expiresAt,
          expirySeconds,
          filename: media.originalFilename,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
          type: media.type,
          error: 'Media đã bị xóa',
        })
        continue
      }

      // Generate presigned URL for valid media
      try {
        const viewUrl = await this.minioService.getPresignedUrl(
          media.bucketName,
          media.objectKey,
          expirySeconds,
        )

        results.push({
          mediaId: media.mediaId,
          viewUrl,
          expiresAt,
          expirySeconds,
          filename: media.originalFilename,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
          type: media.type,
        })
      } catch (error) {
        results.push({
          mediaId: media.mediaId,
          viewUrl: '',
          expiresAt,
          expirySeconds,
          filename: media.originalFilename,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
          type: media.type,
          error: 'Không thể tạo URL xem',
        })
      }
    }

    // Step 3: Calculate summary
    const successCount = results.filter(r => !r.error).length
    const errorCount = results.filter(r => r.error).length

    return BaseResponseDto.success(
      `Đã tạo ${successCount} URL thành công, ${errorCount} lỗi`,
      {
        results,
        summary: {
          total: mediaIds.length,
          success: successCount,
          errors: errorCount,
        },
      },
    )
  }
}
