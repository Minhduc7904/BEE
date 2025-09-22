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
import { StorageProvider } from '../../../shared/enums'
import { getFileExtension } from 'src/shared/utils'

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

            // 4. Generate unique filename
            const fileExtension = getFileExtension(originalName)
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
                            const oldFilePath = this.storageService.extractFilePathFromUrl(oldAvatar.url)
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
}