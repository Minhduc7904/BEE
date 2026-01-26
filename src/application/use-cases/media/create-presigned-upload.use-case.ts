import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaType, MediaStatus } from '../../../shared/enums'
import { BaseResponseDto } from '../../dtos'
import { CreatePresignedUploadDto } from '../../dtos/media/create-presigned-upload.dto'
import { PresignedUploadResponseDto } from '../../dtos/media/presigned-upload-response.dto'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

/**
 * CreatePresignedUploadUseCase - Generate presigned URL for direct upload
 * 
 * RESPONSIBILITIES:
 * ✅ Create Media record with UPLOADING status
 * ✅ Generate presigned URL for frontend to upload directly to MinIO
 * ✅ Return upload URL and media ID for completion
 * 
 * FLOW:
 * 1. Frontend calls this endpoint with file metadata
 * 2. Backend creates DB record with UPLOADING status
 * 3. Backend generates presigned URL (valid for ~15 minutes)
 * 4. Frontend uploads directly to MinIO using presigned URL
 * 5. Frontend calls CompletePresignedUploadUseCase to finalize
 * 
 * ADVANTAGES:
 * - No file passes through backend server
 * - Faster upload for large files
 * - Reduces backend memory/CPU usage
 * - Better for serverless deployments
 */
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
    // Step 1: Validate input
    if (!dto.originalFilename || !dto.mimeType || !dto.fileSize) {
      throw new BadRequestException('Missing required file metadata')
    }

    if (dto.fileSize <= 0) {
      throw new BadRequestException('Invalid file size')
    }

    // Step 2: Detect media type
    const mediaType = dto.type || this.detectMediaType(dto.mimeType)

    // Step 3: Sanitize filename
    const sanitizedFilename = this.sanitizeFilename(dto.originalFilename)

    // Step 4: Generate unique object key
    const objectKey = this.generateObjectKey(sanitizedFilename, mediaType)

    // Step 5: Resolve bucket
    const bucketName = this.resolveBucket(mediaType)

    // Step 6: Create Media record with UPLOADING status
    // This reserves the record before actual upload
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

    // Step 7: Generate presigned PUT URL for upload
    // URL expires in 15 minutes (900 seconds)
    const expiresIn = 900
    const uploadUrl = await this.minioService.getPresignedUploadUrl(
      bucketName,
      objectKey,
      expiresIn,
    )

    // Step 8: Return presigned URL and media ID
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

  /**
   * Detect MediaType from MIME type
   */
  private detectMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE
    }

    if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO
    }

    if (mimeType.startsWith('audio/')) {
      return MediaType.AUDIO
    }

    const documentMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]

    if (documentMimeTypes.some((type) => mimeType.includes(type))) {
      return MediaType.DOCUMENT
    }

    return MediaType.OTHER
  }

  /**
   * Sanitize filename by removing accents and replacing spaces
   */
  private sanitizeFilename(filename: string): string {
    const { name, ext } = path.parse(filename)
    const normalizedExtension = this.normalizeExtension(ext)

    const normalizeVietnamese = (value: string) =>
      value
        .toLowerCase()
        .replace(/đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s_-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

    const sanitizedName = normalizeVietnamese(name) || 'file'
    return `${sanitizedName}${normalizedExtension}`
  }

  private normalizeExtension(extension?: string): string {
    if (!extension) {
      return ''
    }

    const cleaned = extension.replace('.', '').toLowerCase().replace(/[^a-z0-9]/g, '')
    return cleaned ? `.${cleaned}` : ''
  }

  /**
   * Generate unique object key (storage path)
   * Format: uploads/{year}/{month}/{uuid}.{ext}
   */
  private generateObjectKey(originalFilename: string, mediaType: MediaType): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const fileExt = path.extname(originalFilename) || ''
    const uniqueId = uuidv4()

    return `uploads/${year}/${month}/${uniqueId}${fileExt}`
  }

  /**
   * Resolve bucket name based on media type
   */
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
