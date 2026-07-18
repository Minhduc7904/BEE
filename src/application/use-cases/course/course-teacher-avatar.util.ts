import { PrismaService } from '../../../prisma/prisma.service'
import { MinioService } from 'src/application/interfaces'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../shared/constants'
import { MediaStatus } from '../../../shared/enums'

const TEACHER_AVATAR_EXPIRY_SECONDS = 3600 * 24

export async function getTeacherAvatarUrls(
  prisma: PrismaService,
  minioService: MinioService,
  userIds: number[],
): Promise<Map<number, string>> {
  const avatarUrlByUserId = new Map<number, string>()
  const uniqueUserIds = [...new Set(userIds.filter((userId) => Number.isInteger(userId) && userId > 0))]

  if (uniqueUserIds.length === 0) {
    return avatarUrlByUserId
  }

  const usages = await prisma.mediaUsage.findMany({
    where: {
      entityType: EntityType.USER,
      entityId: {
        in: uniqueUserIds,
      },
      fieldName: USER_MEDIA_FIELDS.AVATAR,
      media: {
        status: MediaStatus.READY,
      },
    },
    include: {
      media: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  for (const usage of usages) {
    try {
      avatarUrlByUserId.set(
        usage.entityId,
        await minioService.getPresignedUrl(
          usage.media.bucketName,
          usage.media.objectKey,
          TEACHER_AVATAR_EXPIRY_SECONDS,
        ),
      )
    } catch {
      // Avatar is optional; keep the teacher data when URL generation fails.
    }
  }

  return avatarUrlByUserId
}
