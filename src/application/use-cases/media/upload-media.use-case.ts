import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaProcessingService } from '../../../infrastructure/services/media-processing.service'
import { MediaType, MediaStatus } from '@prisma/client'
import { BaseResponseDto } from '../../dtos'
import { MediaResponseDto } from '../../dtos/media'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Readable } from 'stream'

/**
 * UploadMediaUseCase - Production-ready file upload use case
 * 
 * RESPONSIBILITIES:
 * ✅ Upload file to MinIO storage
 * ✅ Create Media record in database
 * ✅ Handle orphan files (cleanup on failure)
 * ✅ Use stream-based upload (memory-safe)
 * 
 * NOT RESPONSIBLE FOR:
 * ❌ Generating presigned download URLs (see GetMediaDownloadUrlUseCase)
 * ❌ Handling MediaUsage attachment (see AttachMediaUseCase)
 * ❌ Access control / visibility (handled at service layer)
 * ❌ Bucket mapping logic (delegated to MinioService)
 * 
 * ARCHITECTURE:
 * - Application layer use case
 * - Calls IMediaRepository (domain interface)
 * - Calls MinioService (infrastructure)
 * - Returns MediaEntity via DTO
 */
@Injectable()
export class UploadMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
    private readonly mediaProcessingService: MediaProcessingService,
  ) { }

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
    // Step 1: Validate file input
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided')
    }

    // Step 2: Detect media type from MIME type
    const mediaType = options?.type || this.detectMediaType(file.mimetype)

    // Step 3: Optionally optimize file (resize/compress)
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

    // Step 4: Sanitize filename and ensure extension reflects optimized content
    const sanitizedOriginalName = this.sanitizeFilename(
      file.originalname,
      optimized?.extension,
    )

    // Step 5: Generate unique object key (storage path)
    const objectKey = this.generateObjectKey(sanitizedOriginalName, mediaType)

    // Step 6: Resolve target bucket (delegated to MinioService)
    const bucketName = this.resolveBucket(mediaType)

    // Step 7: Create Media record with UPLOADING status
    // This prevents orphan files if upload fails
    let mediaRecord = await this.mediaRepository.create({
      folderId: options?.folderId,
      bucketName,
      objectKey,
      originalFilename: sanitizedOriginalName,
      mimeType: uploadMimeType,
      fileSize: uploadBuffer.length,
      type: mediaType,
      status: MediaStatus.UPLOADING, // Temporary status
      width,
      height,
      duration,
      uploadedBy: userId,
    })

    try {
      // Step 8: Upload file to MinIO using STREAM
      // Stream-based upload prevents loading entire file into memory
      const stream = Readable.from(uploadBuffer)

      await this.minioService.uploadFileStream(
        bucketName,
        objectKey,
        stream,
        {
          'Content-Type': uploadMimeType,
          'Original-Name': sanitizedOriginalName,
        },
      )

      // Step 9: Update status to READY after successful upload
      mediaRecord = await this.mediaRepository.update(mediaRecord.mediaId, {
        status: MediaStatus.READY,
      })

      // Step 10: Return success response
      // Note: No download URL generated here
      // TODO: Use GetMediaDownloadUrlUseCase to generate presigned URL when needed
      // TODO: Use AttachMediaUseCase to link media to entities via MediaUsage
      return BaseResponseDto.success(
        'File uploaded successfully',
        MediaResponseDto.fromEntity(mediaRecord),
      )
    } catch (uploadError) {
      // Step 11: Handle upload failure - cleanup orphan file
      try {
        // Mark as FAILED in database
        await this.mediaRepository.update(mediaRecord.mediaId, {
          status: MediaStatus.FAILED,
        })

        // Attempt to remove file from MinIO (best effort)
        await this.minioService.deleteFile(bucketName, objectKey)
      } catch (cleanupError) {
        // Log cleanup failure but don't mask original error
        console.error('Failed to cleanup orphan file:', cleanupError)
      }

      // Re-throw original upload error
      throw uploadError
    }
  }

  /**
   * Detect MediaType from MIME type
   * Centralizes type detection logic for easy testing
   * 
   * @param mimeType - File MIME type
   * @returns Detected MediaType
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

    // Document detection
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
   * Ensures storage-safe ASCII filenames
   */
  private sanitizeFilename(filename: string, overrideExtension?: string): string {
    const { name, ext } = path.parse(filename)
    const normalizedExtension = this.normalizeExtension(overrideExtension ?? ext)

    const normalizeVietnamese = (value: string) =>
      value
        .toLowerCase()
        .replace(/đ/g, 'd')                // map riêng
        .normalize('NFD')                  // 🔑 dùng NFD, KHÔNG NFKD
        .replace(/[\u0300-\u036f]/g, '')   // xoá dấu
        .replace(/[^a-z0-9\s_-]/g, '')     // chỉ lọc ký tự, KHÔNG phá chữ
        .trim()
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

    const sanitizedName = normalizeVietnamese(name) || 'file'
    const finalExt = normalizedExtension

    return `${sanitizedName}${finalExt}`
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
   * 
   * @param originalFilename - Original file name
   * @param mediaType - Detected media type
   * @returns Object key for storage
   */
  private generateObjectKey(originalFilename: string, mediaType: MediaType): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const fileExt = path.extname(originalFilename) || ''
    const uniqueId = uuidv4()

    // Format: uploads/2026/01/abc123-def456.jpg
    return `uploads/${year}/${month}/${uniqueId}${fileExt}`
  }

  /**
   * Resolve bucket name based on media type
   * Abstracts bucket mapping logic from MinioService
   * 
   * @param mediaType - Media type
   * @returns Bucket name
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
