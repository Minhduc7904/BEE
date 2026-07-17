import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { MinioService } from 'src/application/interfaces'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { UpdateAvatarResponseDto } from '../../dtos/user/update-avatar.dto'
import {
  NotFoundException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'
import {
  detectMediaType,
  generateObjectKey,
  sanitizeFilename,
} from 'src/shared/utils'
import { MediaStatus, MediaType } from 'src/shared/enums'

@Injectable()
export class UpdateUserAvatarUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    userId: number,
    file: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<BaseResponseDto<UpdateAvatarResponseDto>> {
    return await this.unitOfWork.executeInTransaction(async (repos) => {
      const detectedMediaType = detectMediaType(mimeType)
      if (detectedMediaType !== MediaType.IMAGE) {
        throw new ValidationException('Avatar must be an image file')
      }

      const user = await repos.userRepository.findById(userId)
      if (!user) {
        throw new NotFoundException('User khong ton tai')
      }

      const sanitizedFilename = sanitizeFilename(originalName, {
        fallbackName: 'avatar',
      })
      const objectKey = generateObjectKey('avatars', sanitizedFilename)
      const bucketName = this.minioService.getBuckets().images

      try {
        const uploadResult = await this.minioService.uploadFile(
          bucketName,
          objectKey,
          file,
          {
            'Content-Type': mimeType,
          },
        )

        const avatarUrl = await this.minioService.getPresignedDownloadUrl(
          uploadResult.bucketName,
          uploadResult.objectKey,
          7 * 24 * 3600,
          originalName,
        )

        const newAvatar = await repos.mediaRepository.create({
          bucketName: uploadResult.bucketName,
          objectKey: uploadResult.objectKey,
          originalFilename: sanitizedFilename,
          mimeType,
          fileSize: file.length,
          type: detectedMediaType,
          status: MediaStatus.READY,
          uploadedBy: userId,
        })

        await repos.userRepository.update(userId, {
          avatarId: newAvatar.mediaId,
        })

        return BaseResponseDto.success('Cap nhat avatar thanh cong', {
          userId,
          avatarId: newAvatar.mediaId,
          url: avatarUrl,
        })
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError)
        throw new ValidationException(`Upload avatar that bai: ${uploadError.message}`)
      }
    })
  }
}
