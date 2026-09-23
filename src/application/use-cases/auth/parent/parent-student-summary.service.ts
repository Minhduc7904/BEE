import { Inject, Injectable } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../../domain/repositories'
import { Student } from '../../../../domain/entities/user/student.entity'
import { ParentStudentSummaryDto } from '../../../dtos'
import { USER_MEDIA_FIELDS } from '../../../../shared/constants'
import { EntityType } from '../../../../shared/constants/entity-type.constants'
import { MediaStatus, MediaVisibility } from '../../../../shared/enums'
import { buildMediaUsageContentUrl } from '../../../../shared/utils'

@Injectable()
export class ParentStudentSummaryService {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) {}

  async createMany(students: Student[]): Promise<ParentStudentSummaryDto[]> {
    const avatarUrlByUserId = await this.findAvatarUrlsByUserIds(
      students.map((student) => student.userId),
    )

    return students.map((student) =>
      ParentStudentSummaryDto.fromStudent(student, avatarUrlByUserId.get(student.userId) ?? null),
    )
  }

  /**
   * Batch-resolve the public avatar content URL for a set of user IDs.
   * Only PUBLIC, READY avatar usages are exposed; everything else maps to null.
   * Shared with other Parent-facing flows (e.g. password recovery) so they
   * stay consistent with the avatar shown on the profile/login response.
   */
  async findAvatarUrlsByUserIds(userIds: number[]): Promise<Map<number, string | null>> {
    const uniqueUserIds = [...new Set(userIds)]
    const usages = await this.mediaUsageRepository.findByEntities(
      EntityType.USER,
      uniqueUserIds,
      USER_MEDIA_FIELDS.AVATAR,
    )

    const avatarUrlByUserId = new Map<number, string | null>()
    for (const usage of usages) {
      const isPublicAndReady =
        usage.visibility === MediaVisibility.PUBLIC && usage.media?.status === MediaStatus.READY
      avatarUrlByUserId.set(
        usage.entityId,
        isPublicAndReady ? buildMediaUsageContentUrl(usage.usageId) : null,
      )
    }

    return avatarUrlByUserId
  }
}
