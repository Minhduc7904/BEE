import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { BaseResponseDto } from '../../dtos'

@Injectable()
export class DeleteMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) { }

  /**
   * Soft delete media - marks as DELETED
   * Safer default option, preserves data
   */
  async executeSoftDelete(mediaId: number) {
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    await this.mediaRepository.softDelete(mediaId)

    return BaseResponseDto.success(
      'Media deleted successfully',
      { deleted: true, message: 'Media marked as deleted' }
    )
  }

  /**
   * Soft delete media by user - marks as DELETED for specific user
   * Useful for multi-tenant scenarios
   */
  async executeSoftDeleteByUser(mediaId: number, userId: number) {
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }
    if (media.uploadedBy !== userId) {
      throw new NotFoundException(`Media with ID ${mediaId} not found for this user`)
    }
    await this.mediaRepository.softDelete(mediaId)

    return BaseResponseDto.success(
      'Media deleted successfully for user',
      { deleted: true, message: 'Media marked as deleted for this user' }
    )
  }

  /**
   * Hard delete media - permanently removes from storage and database
   * WARNING: This action cannot be undone
   */
  async executeHardDelete(mediaId: number) {
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    // Delete from MinIO first
    await this.minioService.deleteFile(media.bucketName, media.objectKey)

    // Then soft delete in database (keep record for audit)
    // Physical DB deletion should be handled by cleanup job
    await this.mediaRepository.hardDelete(mediaId)

    return BaseResponseDto.success(
      'Media permanently deleted',
      { deleted: true, message: 'Media permanently deleted from storage' }
    )
  }
}
