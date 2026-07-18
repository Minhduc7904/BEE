import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from 'src/application/interfaces'
import { MediaProcessingService } from 'src/application/interfaces'
import { MediaType, MediaStatus } from 'src/shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaResponseDto } from '../../dtos/media'
import { Readable } from 'stream'
import {
  detectMediaType,
  generateObjectKey,
  sanitizeFilename,
} from 'src/shared/utils'

@Injectable()
export class UploadMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
    private readonly mediaProcessingService: MediaProcessingService,
  ) {}

  async execute(
    file: Express.Multer.File,
    userId: number,
    options?: {
      folderId?: number
      type?: MediaType
      width?: number
      height?: number
      duration?: number
    },
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided')
    }

    const detectedMediaType = detectMediaType(file.mimetype)
    const mediaType =
      detectedMediaType !== MediaType.OTHER
        ? detectedMediaType
        : (options?.type ?? MediaType.OTHER)

    let uploadBuffer = file.buffer
    let uploadMimeType = file.mimetype
    let width = options?.width
    let height = options?.height
    let duration = options?.duration

    const optimized = await this.mediaProcessingService.optimize({
      buffer: file.buffer,
      mimeType: file.mimetype,
      mediaType,
    })

    if (optimized) {
      uploadBuffer = optimized.buffer
      uploadMimeType = optimized.mimeType
      width = optimized.width ?? width
      height = optimized.height ?? height
      duration = optimized.duration ?? duration
    }

    const sanitizedOriginalName = sanitizeFilename(file.originalname, {
      fallbackName: 'file',
      overrideExtension: optimized?.extension,
    })

    const objectKey = generateObjectKey('uploads', sanitizedOriginalName)
    const bucketName = this.resolveBucket(mediaType)

    let mediaRecord = await this.mediaRepository.create({
      folderId: options?.folderId,
      bucketName,
      objectKey,
      originalFilename: sanitizedOriginalName,
      mimeType: uploadMimeType,
      fileSize: uploadBuffer.length,
      type: mediaType,
      status: MediaStatus.UPLOADING,
      width,
      height,
      duration,
      uploadedBy: userId,
    })

    try {
      const stream = Readable.from(uploadBuffer)

      await this.minioService.uploadFileStream(bucketName, objectKey, stream, {
        'Content-Type': uploadMimeType,
        'Original-Name': sanitizedOriginalName,
      })

      mediaRecord = await this.mediaRepository.update(mediaRecord.mediaId, {
        status: MediaStatus.READY,
      })

      return BaseResponseDto.success(
        'File uploaded successfully',
        MediaResponseDto.fromEntity(mediaRecord),
      )
    } catch (uploadError) {
      try {
        await this.mediaRepository.update(mediaRecord.mediaId, {
          status: MediaStatus.FAILED,
        })

        await this.minioService.deleteFile(bucketName, objectKey)
      } catch (cleanupError) {
        console.error('Failed to cleanup orphan file:', cleanupError)
      }

      throw uploadError
    }
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
