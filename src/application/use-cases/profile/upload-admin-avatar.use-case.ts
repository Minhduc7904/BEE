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

@Injectable()
export class UploadAdminAvatarUseCase {
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
        const user = await this.userRepository.findById(userId)
        if (!user || !user.isActive) {
            throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
        }

        if (!file || !file.buffer) {
            throw new BadRequestException('No file provided')
        }

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Avatar must be an image file')
        }

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

        const sanitizedName = this.sanitizeFilename(
            file.originalname,
            optimized?.extension,
        )

        const objectKey = this.generateObjectKey(sanitizedName)
        const bucketName = this.minioService.getBuckets().images

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

            mediaRecord = await this.mediaRepository.update(mediaRecord.mediaId, {
                status: MediaStatus.READY,
            })

            await this.mediaUsageRepository.detachByEntity(
                EntityType.USER,
                userId,
                FIELD_NAMES.AVATAR,
            )

            await this.mediaUsageRepository.attach({
                mediaId: mediaRecord.mediaId,
                entityType: EntityType.USER,
                entityId: userId,
                fieldName: FIELD_NAMES.AVATAR,
                usedBy: userId,
                visibility: MediaVisibility.PUBLIC,
            })

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
                'Admin avatar uploaded successfully',
                mediaResponse,
            )
        } catch (uploadError) {
            try {
                await this.mediaRepository.update(mediaRecord.mediaId, {
                    status: MediaStatus.FAILED,
                })
                await this.minioService.deleteFile(bucketName, objectKey)
            } catch (cleanupError) {
                console.error('Failed to cleanup orphan admin avatar file:', cleanupError)
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
