import { Inject, Injectable } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../../domain/repositories'
import { Student } from '../../../../domain/entities/user/student.entity'
import { MinioService } from '../../../interfaces'
import { ParentStudentSummaryDto } from '../../../dtos'
import { USER_MEDIA_FIELDS } from '../../../../shared/constants'
import { EntityType } from '../../../../shared/constants/entity-type.constants'
import { MediaStatus } from '../../../../shared/enums'

const AVATAR_URL_EXPIRY_SECONDS = 24 * 60 * 60

@Injectable()
export class ParentStudentSummaryService {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async createMany(students: Student[]): Promise<ParentStudentSummaryDto[]> {
    const userIds = [...new Set(students.map((student) => student.userId))]
    const usages = await this.mediaUsageRepository.findByEntities(EntityType.USER, userIds, USER_MEDIA_FIELDS.AVATAR)
    const firstReadyUsageByUserId = new Map(
      usages
        .filter((usage) => usage.media?.status === MediaStatus.READY)
        .map((usage) => [usage.entityId, usage] as const),
    )
    const avatarEntries = await Promise.all(
      [...firstReadyUsageByUserId].map(async ([userId, usage]) => {
        try {
          const media = usage.media!
          const url = await this.minioService.getPresignedUrl(
            media.bucketName,
            media.objectKey,
            AVATAR_URL_EXPIRY_SECONDS,
          )
          return [userId, url] as const
        } catch {
          return [userId, null] as const
        }
      }),
    )
    const avatarUrlByUserId = new Map<number, string | null>(avatarEntries)

    return students.map((student) =>
      ParentStudentSummaryDto.fromStudent(student, avatarUrlByUserId.get(student.userId) ?? null),
    )
  }
}
