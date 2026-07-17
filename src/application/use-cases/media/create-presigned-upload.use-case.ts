import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from 'src/application/interfaces'
import { MediaType, MediaStatus } from '../../../shared/enums'
import { BaseResponseDto } from '../../dtos'
import { CreatePresignedUploadDto } from '../../dtos/media/create-presigned-upload.dto'
import { PresignedUploadResponseDto } from '../../dtos/media/presigned-upload-response.dto'
import {
  detectMediaType,
  generateObjectKey,
  sanitizeFilename,
} from 'src/shared/utils'

@Injectable()
export class CreatePresignedUploadUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    dto: CreatePresignedUploadDto,
    userId: number,
  ): Promise<BaseResponseDto<PresignedUploadResponseDto>> {
    if (!dto.originalFilename || !dto.mimeType || !dto.fileSize) {
      throw new BadRequestException('Missing required file metadata')
    }

    if (dto.fileSize <= 0) {
      throw new BadRequestException('Invalid file size')
    }

    const detectedMediaType = detectMediaType(dto.mimeType)
    const mediaType =
      detectedMediaType !== MediaType.OTHER
        ? detectedMediaType
        : (dto.type ?? MediaType.OTHER)

    const sanitizedFilename = sanitizeFilename(dto.originalFilename, {
      fallbackName: 'file',
    })

    const objectKey = generateObjectKey('uploads', sanitizedFilename)
    const bucketName = this.resolveBucket(mediaType)

    const mediaRecord = await this.mediaRepository.create({
      folderId: dto.folderId,
      bucketName,
      objectKey,
      originalFilename: sanitizedFilename,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      type: mediaType,
      status: MediaStatus.UPLOADING,
      width: dto.width,
      height: dto.height,
      duration: dto.duration,
      uploadedBy: userId,
    })

    const expiresIn = 900
    const uploadUrl = await this.minioService.getPresignedUploadUrl(
      bucketName,
      objectKey,
      expiresIn,
    )

    const response = PresignedUploadResponseDto.create({
      uploadUrl,
      mediaId: mediaRecord.mediaId,
      bucketName,
      objectKey,
      expiresIn,
      originalFilename: sanitizedFilename,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      type: mediaType,
    })

    return BaseResponseDto.success(
      'Presigned upload URL generated successfully',
      response,
    )
  }

  private resolveBucket(mediaType: MediaType): string {
    const buckets = this.minioService.getBuckets()

    switch (mediaType) {
      case MediaType.IMAGE:
        return buckets.images
      case MediaType.VIDEO:
        return buckets.videos
      case MediaType.AUDIO:
        return buckets.audios
      case MediaType.DOCUMENT:
        return buckets.documents
      default:
        return buckets.others
    }
  }
}
