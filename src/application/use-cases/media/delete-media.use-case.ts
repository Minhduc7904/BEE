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
  ) {}

  async execute(mediaId: number, hardDelete: boolean = false) {
    // Check if media exists
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    if (hardDelete) {
      // Delete from MinIO
      await this.minioService.deleteFile(media.bucketName, media.objectKey)
      
      // Delete from database
      await this.mediaRepository.delete(mediaId)
      
      return BaseResponseDto.success(
        'Media permanently deleted',
        { deleted: true, message: 'Media permanently deleted' }
      )
    } else {
      // Soft delete (mark as DELETED)
      await this.mediaRepository.softDelete(mediaId)
      
      return BaseResponseDto.success(
        'Media soft deleted',
        { deleted: true, message: 'Media soft deleted' }
      )
    }
  }
}
