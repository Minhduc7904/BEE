// src/application/use-cases/user/update-user-avatar.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import type { IStorageService } from '../../../domain/interface/storage.interface'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { UpdateAvatarResponseDto } from '../../dtos/user/update-avatar.dto'
import {
    NotFoundException,
    ValidationException
} from '../../../shared/exceptions/custom-exceptions'
import { StorageProvider } from '@prisma/client'

@Injectable()
export class UpdateUserAvatarUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('IStorageService') private readonly storageService: IStorageService,
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

            // 2. Validate file type
            if (!this.isValidImageType(mimeType)) {
                throw new ValidationException('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP)')
            }

            // 3. Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024 // 5MB
            if (file.length > maxSize) {
                throw new ValidationException('File ảnh không được vượt quá 5MB')
            }

            // 4. Generate unique filename
            const fileExtension = this.getFileExtension(originalName)
            const fileName = `avatar_${userId}_${Date.now()}.${fileExtension}`

            try {
                // 5. Upload file to Supabase
                const uploadResult = await this.storageService.uploadFile(file, {
                    fileName,
                    folder: 'avatars',
                    contentType: mimeType,
                    upsert: true
                })

                // 6. Xóa avatar cũ nếu có
                if (user.avatarId) {
                    try {
                        const oldAvatar = await repos.imageRepository.findById(user.avatarId)
                        if (oldAvatar && oldAvatar.storageProvider === StorageProvider.SUPABASE) {
                            // Delete old file from Supabase
                            const oldFilePath = this.extractFilePathFromUrl(oldAvatar.url)
                            if (oldFilePath) {
                                await this.storageService.deleteFile(oldFilePath)
                            }
                        }
                        // Delete old avatar record from database
                        await repos.imageRepository.delete(user.avatarId)
                    } catch (error) {
                        console.warn('Failed to delete old avatar:', error.message)
                        // Continue execution even if old avatar deletion fails
                    }
                }

                // 7. Lưu thông tin avatar mới vào database
                const newAvatar = await repos.imageRepository.create({
                    url: uploadResult.url,
                    storageProvider: StorageProvider.SUPABASE,
                    mimeType: mimeType
                })

                // 8. Cập nhật avatarId cho user
                await repos.userRepository.update(userId, {
                    avatarId: newAvatar.imageId
                })

                // 9. Trả về response
                return BaseResponseDto.success('Cập nhật avatar thành công', {
                    avatarId: newAvatar.imageId,
                    avatarUrl: uploadResult.url,
                    fileName: uploadResult.fileName,
                    fileSize: uploadResult.size
                })

            } catch (uploadError) {
                throw new ValidationException(`Upload avatar thất bại: ${uploadError.message}`)
            }
        })
    }

    private isValidImageType(mimeType: string): boolean {
        const validTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ]
        return validTypes.includes(mimeType.toLowerCase())
    }

    private getFileExtension(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase()

        // Map MIME types to extensions for safety
        const extensionMap: { [key: string]: string } = {
            'jpeg': 'jpg',
            'jpg': 'jpg',
            'png': 'png',
            'gif': 'gif',
            'webp': 'webp'
        }

        return extensionMap[extension || ''] || 'jpg'
    }

    private extractFilePathFromUrl(url: string): string | null {
        try {
            // Extract file path from Supabase URL
            // Format: https://your-project.supabase.co/storage/v1/object/public/bucket/path/to/file
            const match = url.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)/)
            return match ? match[1] : null
        } catch (error) {
            return null
        }
    }
}