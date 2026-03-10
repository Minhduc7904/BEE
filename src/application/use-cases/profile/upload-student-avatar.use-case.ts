// src/application/use-cases/profile/upload-student-avatar.use-case.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import type { IMediaRepository, IMediaUsageRepository, IUserRepository } from '../../../domain/repositories'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaProcessingService } from '../../../infrastructure/services/media-processing.service'
import { MediaType, MediaStatus, MediaVisibility } from '../../../shared/enums'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { FIELD_NAMES } from '../../../shared/constants'
import { BaseResponseDto } from '../../dtos'
import { MediaResponseDto } from '../../dtos/media'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Readable } from 'stream'

/**
 * UploadStudentAvatarUseCase - Upload avatar cho student
 * 
 * RESPONSIBILITIES:
 * ✅ Upload avatar file to MinIO storage
 * ✅ Create Media record in database
 * ✅ Detach old avatar media usage (nếu có)
 * ✅ Attach new avatar media usage (entityType=USER, fieldName=avatar)
 * ✅ Return media response with presigned viewUrl
 */
@Injectable()
export class UploadStudentAvatarUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
        private readonly mediaProcessingService: MediaProcessingService,
    ) { }

    async execute(
        file: Express.Multer.File,
        userId: number,
    ): Promise<BaseResponseDto<MediaResponseDto>> {
        // Step 0: Kiểm tra user active
        const user = await this.userRepository.findById(userId)
        if (!user || !user.isActive) {
            throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
        }

        // Step 1: Validate file input
        if (!file || !file.buffer) {
            throw new BadRequestException('No file provided')
        }

        // Step 2: Validate image type
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Avatar must be an image file')
        }

        // Step 3: Optimize image (resize/compress)
        let uploadBuffer = file.buffer
        let uploadMimeType = file.mimetype
        let width: number | undefined
        let height: number | undefined

        const optimized = await this.mediaProcessingService.optimize({
            buffer: file.buffer,
            mimeType: file.mimetype,
            mediaType: MediaType.IMAGE,
        })

        if (optimized) {
            uploadBuffer = optimized.buffer
            uploadMimeType = optimized.mimeType
            width = optimized.width ?? undefined
            height = optimized.height ?? undefined
        }

        // Step 4: Sanitize filename
        const sanitizedName = this.sanitizeFilename(
            file.originalname,
            optimized?.extension,
        )

        // Step 5: Generate unique object key
        const objectKey = this.generateObjectKey(sanitizedName)

        // Step 6: Resolve bucket
        const bucketName = this.minioService.getBuckets().images

        // Step 7: Create Media record with UPLOADING status
        let mediaRecord = await this.mediaRepository.create({
            bucketName,
            objectKey,
            originalFilename: sanitizedName,
            mimeType: uploadMimeType,
            fileSize: uploadBuffer.length,
            type: MediaType.IMAGE,
            status: MediaStatus.UPLOADING,
            width,
            height,
            uploadedBy: userId,
        })

        try {
            // Step 8: Upload file to MinIO
            const stream = Readable.from(uploadBuffer)
            await this.minioService.uploadFileStream(
                bucketName,
                objectKey,
                stream,
                {
                    'Content-Type': uploadMimeType,
                    'Original-Name': sanitizedName,
                },
            )

            // Step 9: Update status to READY
            mediaRecord = await this.mediaRepository.update(mediaRecord.mediaId, {
                status: MediaStatus.READY,
            })

            // Step 10: Detach old avatar media usage (nếu có)
            await this.mediaUsageRepository.detachByEntity(
                EntityType.USER,
                userId,
                FIELD_NAMES.AVATAR,
            )

            // Step 11: Attach new avatar media usage
            await this.mediaUsageRepository.attach({
                mediaId: mediaRecord.mediaId,
                entityType: EntityType.USER,
                entityId: userId,
                fieldName: FIELD_NAMES.AVATAR,
                usedBy: userId,
                visibility: MediaVisibility.PUBLIC,
            })

            // Step 12: Generate presigned URL for response
            const mediaResponse = MediaResponseDto.fromEntity(mediaRecord)
            try {
                mediaResponse.viewUrl = await this.minioService.getPresignedUrl(
                    bucketName,
                    objectKey,
                    3600,
                )
            } catch {
                // Silently ignore - viewUrl is optional
            }

            return BaseResponseDto.success(
                'Avatar uploaded successfully',
                mediaResponse,
            )
        } catch (uploadError) {
            // Cleanup on failure
            try {
                await this.mediaRepository.update(mediaRecord.mediaId, {
                    status: MediaStatus.FAILED,
                })
                await this.minioService.deleteFile(bucketName, objectKey)
            } catch (cleanupError) {
                console.error('Failed to cleanup orphan avatar file:', cleanupError)
            }

            throw uploadError
        }
    }

    private sanitizeFilename(filename: string, overrideExtension?: string): string {
        const { name, ext } = path.parse(filename)
        const normalizedExtension = this.normalizeExtension(overrideExtension ?? ext)

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

        const sanitizedName = normalizeVietnamese(name) || 'avatar'
        return `${sanitizedName}${normalizedExtension}`
    }

    private normalizeExtension(extension?: string): string {
        if (!extension) return ''
        const cleaned = extension.replace('.', '').toLowerCase().replace(/[^a-z0-9]/g, '')
        return cleaned ? `.${cleaned}` : ''
    }

    private generateObjectKey(originalFilename: string): string {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const fileExt = path.extname(originalFilename) || ''
        const uniqueId = uuidv4()

        return `avatars/${year}/${month}/${uniqueId}${fileExt}`
    }
}
