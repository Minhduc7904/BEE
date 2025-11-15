import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaType, MediaStatus } from '@prisma/client'
import { BaseResponseDto } from '../../dtos'
import { MediaResponseDto } from '../../dtos/media'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UploadMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
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
    // Detect media type from mime type
    const mediaType = options?.type || this.detectMediaType(file.mimetype)
    
    // Generate unique object key
    const fileExt = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExt}`
    const objectKey = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`

    // Get bucket name based on media type
    const buckets = this.minioService.getBuckets()
    let bucketName: string

    switch (mediaType) {
      case MediaType.IMAGE:
        bucketName = buckets.images
        break
      case MediaType.VIDEO:
        bucketName = buckets.videos
        break
      case MediaType.DOCUMENT:
        bucketName = buckets.documents
        break
      case MediaType.AUDIO:
        bucketName = buckets.audios
        break
      default:
        bucketName = buckets.others
    }

    // Upload to MinIO
    const uploadResult = await this.minioService.uploadFile(
      bucketName,
      objectKey,
      file.buffer,
      {
        'Content-Type': file.mimetype,
        'Original-Name': file.originalname,
      },
    )

    // Save to database
    const media = await this.mediaRepository.create({
      folderId: options?.folderId,
      bucketName: uploadResult.bucketName,
      objectKey: uploadResult.objectKey,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      type: mediaType,
      status: MediaStatus.READY,
      publicUrl: uploadResult.publicUrl,
      width: options?.width,
      height: options?.height,
      duration: options?.duration,
      uploadedBy: userId,
    })

    return BaseResponseDto.success(
      'File uploaded successfully',
      MediaResponseDto.fromEntity(media)
    )
  }

  private detectMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE
    if (mimeType.startsWith('video/')) return MediaType.VIDEO
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('powerpoint')
    ) {
      return MediaType.DOCUMENT
    }
    return MediaType.OTHER
  }
}
