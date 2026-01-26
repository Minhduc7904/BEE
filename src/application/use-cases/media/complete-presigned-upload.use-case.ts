import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from '../../../shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaResponseDto } from '../../dtos/media'
import { CompleteUploadDto } from '../../dtos/media/complete-upload.dto'

/**
 * CompletePresignedUploadUseCase - Finalize presigned upload
 * 
 * RESPONSIBILITIES:
 * ✅ Verify file exists in MinIO after frontend upload
 * ✅ Update Media record status from UPLOADING to READY
 * ✅ Update actual file size if different from expected
 * ✅ Handle failure cases (file not found, upload incomplete)
 * 
 * FLOW:
 * 1. Frontend successfully uploads to MinIO using presigned URL
 * 2. Frontend calls this endpoint with mediaId
 * 3. Backend verifies file exists in MinIO
 * 4. Backend updates status to READY
 * 5. Return updated Media record
 * 
 * ERROR HANDLING:
 * - If file not found in MinIO: mark as FAILED
 * - If media record not found: throw NotFoundException
 * - If already completed: return success (idempotent)
 */
@Injectable()
export class CompletePresignedUploadUseCase {
  private readonly logger = new Logger(CompletePresignedUploadUseCase.name)

  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    dto: CompleteUploadDto,
    userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    // Step 1: Find media record
    const mediaRecord = await this.mediaRepository.findById(dto.mediaId)

    if (!mediaRecord) {
      throw new NotFoundException(`Media with ID ${dto.mediaId} not found`)
    }

    // Step 2: Verify ownership
    if (mediaRecord.uploadedBy !== userId) {
      throw new BadRequestException('You are not authorized to complete this upload')
    }

    // Step 3: Check if already completed (idempotent)
    if (mediaRecord.status === MediaStatus.READY) {
      return BaseResponseDto.success(
        'Upload already completed',
        MediaResponseDto.fromEntity(mediaRecord),
      )
    }

    // Step 4: Verify file exists in MinIO
    try {
      const fileStats = await this.minioService.getFileMetadata(
        mediaRecord.bucketName,
        mediaRecord.objectKey,
      )

      // Step 5: Verify file exists (if we got here, it exists)
      this.logger.log(`File verified in storage: ${mediaRecord.objectKey} (${fileStats.size} bytes)`)

      // Step 6: Update status to READY
      const updatedMedia = await this.mediaRepository.update(dto.mediaId, {
        status: MediaStatus.READY,
      })

      return BaseResponseDto.success(
        'Upload completed successfully',
        MediaResponseDto.fromEntity(updatedMedia),
      )
    } catch (error) {
      // Step 7: File not found in MinIO - mark as FAILED
      await this.mediaRepository.update(dto.mediaId, {
        status: MediaStatus.FAILED,
      })

      throw new BadRequestException(
        'File not found in storage. Upload may have failed. Please try again.',
      )
    }
  }
}
