import { Injectable, Logger } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { PrismaService } from '../../../prisma/prisma.service'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

interface AvatarFileTarget {
  mediaId: number
  bucketName: string
  objectKey: string
}

interface AvatarFileDeleteResult extends AvatarFileTarget {
  status: 'deleted' | 'failed'
  reason?: string
}

export interface HardDeleteAdminResult {
  adminId: number
  userId: number
  transferredMediaCount: number
  transferredMediaToAdminId: number | null
  deletedAvatarMediaCount: number
  deletedAvatarFilesCount: number
  failedAvatarFilesCount: number
  avatarFileResults: AvatarFileDeleteResult[]
}

@Injectable()
export class HardDeleteAdminUseCase {
  private readonly logger = new Logger(HardDeleteAdminUseCase.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) { }

  async execute(adminId: number): Promise<BaseResponseDto<HardDeleteAdminResult>> {
    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const admin = await tx.admin.findUnique({
        where: { adminId },
        select: { userId: true },
      })

      if (!admin) {
        throw new NotFoundException(`Admin với ID ${adminId} không tồn tại`)
      }

      // Media.uploadedBy references User, so resolve the system owner from adminId = 1.
      const fallbackAdmin = await tx.admin.findUnique({
        where: { adminId: 1 },
        select: { userId: true },
      })
      const fallbackUserId = fallbackAdmin && adminId !== 1 ? fallbackAdmin.userId : null

      const avatarMedia = await tx.media.findMany({
        where: {
          usages: {
            some: {
              entityType: EntityType.USER,
              entityId: admin.userId,
              fieldName: USER_MEDIA_FIELDS.AVATAR,
            },
          },
        },
        select: {
          mediaId: true,
          bucketName: true,
          objectKey: true,
        },
      })
      const avatarMediaIds = avatarMedia.map((media) => media.mediaId)

      // Preserve every non-avatar upload by transferring its owner before deleting the user.
      const transferredMedia = await tx.media.updateMany({
        where: {
          uploadedBy: admin.userId,
          ...(avatarMediaIds.length > 0 ? { mediaId: { notIn: avatarMediaIds } } : {}),
        },
        data: {
          uploadedBy: fallbackUserId,
        },
      })

      // Avatar media is intentionally removed even when it has additional usage records.
      const deletedAvatarMedia = avatarMediaIds.length
        ? await tx.media.deleteMany({
            where: {
              mediaId: {
                in: avatarMediaIds,
              },
            },
          })
        : { count: 0 }

      // Database-level cascades remove admin-owned records before the account is deleted.
      await tx.admin.delete({
        where: { adminId },
      })

      await tx.user.delete({
        where: { userId: admin.userId },
      })

      return {
        userId: admin.userId,
        avatarFilesToDelete: avatarMedia,
        transferredMediaCount: transferredMedia.count,
        transferredMediaToAdminId: fallbackUserId ? 1 : null,
        deletedAvatarMediaCount: deletedAvatarMedia.count,
      }
    })

    const avatarFileResults = await this.deleteAvatarFiles(transactionResult.avatarFilesToDelete)
    const deletedAvatarFilesCount = avatarFileResults.filter((result) => result.status === 'deleted').length
    const failedAvatarFilesCount = avatarFileResults.filter((result) => result.status === 'failed').length

    return BaseResponseDto.success('Xóa vĩnh viễn admin thành công', {
      adminId,
      userId: transactionResult.userId,
      transferredMediaCount: transactionResult.transferredMediaCount,
      transferredMediaToAdminId: transactionResult.transferredMediaToAdminId,
      deletedAvatarMediaCount: transactionResult.deletedAvatarMediaCount,
      deletedAvatarFilesCount,
      failedAvatarFilesCount,
      avatarFileResults,
    })
  }

  private async deleteAvatarFiles(files: AvatarFileTarget[]): Promise<AvatarFileDeleteResult[]> {
    const results: AvatarFileDeleteResult[] = []

    for (const file of files) {
      try {
        await this.minioService.deleteFile(file.bucketName, file.objectKey)
        results.push({ ...file, status: 'deleted' })
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error'
        this.logger.error(`Cannot delete avatar file ${file.bucketName}/${file.objectKey}: ${reason}`)
        results.push({ ...file, status: 'failed', reason })
      }
    }

    return results
  }
}
