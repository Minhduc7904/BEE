// src/application/use-cases/user/update-user-avatar.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { UpdateAvatarResponseDto } from '../../dtos/user/update-avatar.dto'
import {
    NotFoundException,
    ValidationException
} from '../../../shared/exceptions/custom-exceptions'
import { getFileExtension } from 'src/shared/utils'

@Injectable()
export class UpdateUserAvatarUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        private readonly minioService: MinioService,
    ) { }

    async execute(
        userId: number,
        file: Buffer,
        originalName: string,
        mimeType: string
    ): Promise<BaseResponseDto<UpdateAvatarResponseDto>> {
        return await this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Kiểm tra user tồn tại
            const user = await repos.userRepository.findById(userId)
            if (!user) {
                throw new NotFoundException('User không tồn tại')
            }

            // 4. Generate unique filename
            const fileExtension = getFileExtension(originalName)
            const fileName = `avatar_${userId}_${Date.now()}.${fileExtension}`

            try {
                // 5. Upload file to MinIO storage
                const objectKey = `avatars/${fileName}`
                const uploadResult = await this.minioService.uploadFile(
                    'avatars',
                    objectKey,
                    file,
                    {
                        'Content-Type': mimeType
                    }
                )

                // 6. Xóa avatar cũ nếu có
                if (user.avatarId) {
                    try {
                        const oldAvatar = await repos.mediaRepository.findById(user.avatarId)
                        if (oldAvatar) {
                            // Soft delete old avatar
                            await repos.mediaRepository.softDelete(user.avatarId)
                            // Xóa file cũ khỏi MinIO
                            await this.minioService.deleteFile(oldAvatar.bucketName, oldAvatar.objectKey)
                        }
                    } catch (error) {
                        console.warn('Failed to delete old avatar:', error.message)
                    }
                }

                // Generate presigned URL for the uploaded avatar (expires in 7 days)
                const avatarUrl = await this.minioService.getPresignedDownloadUrl(
                    uploadResult.bucketName,
                    uploadResult.objectKey,
                    7 * 24 * 3600, // 7 days
                    originalName,
                )

                // 7. Lưu thông tin avatar mới vào Media
                const newAvatar = await repos.mediaRepository.create({
                    bucketName: uploadResult.bucketName,
                    objectKey: uploadResult.objectKey,
                    originalFilename: originalName,
                    mimeType: mimeType,
                    fileSize: file.length,
                    type: 'IMAGE' as any,
                    status: 'READY' as any,
                    // publicUrl: avatarUrl,
                    uploadedBy: userId
                })

                // 8. Cập nhật avatarId cho user
                await repos.userRepository.update(userId, {
                    avatarId: newAvatar.mediaId
                })

                // 9. Trả về response
                return BaseResponseDto.success('Cập nhật avatar thành công', {
                    userId: userId,
                    avatarId: newAvatar.mediaId,
                    url: avatarUrl,
                })

            } catch (uploadError) {
                console.error('Avatar upload error:', uploadError)
                throw new ValidationException(`Upload avatar thất bại: ${uploadError.message}`)
            }
        })
    }
}