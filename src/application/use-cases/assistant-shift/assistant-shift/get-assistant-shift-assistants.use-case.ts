import { Inject, Injectable } from '@nestjs/common'

import { AdminResponseDto, AssistantShiftAssistantListQueryDto, PaginationResponseDto } from '../../../dtos'
import type { IAdminRepository, IMediaUsageRepository } from '../../../../domain/repositories'
import { ASSISTANT_SHIFT_CONFIG } from '../../../../shared/constants/assistant-shift.constants'
import { EntityType } from '../../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../../shared/constants'
import { MediaStatus } from '../../../../shared/enums'
import { MinioService } from '../../../interfaces'

@Injectable()
export class GetAssistantShiftAssistantsUseCase {
  constructor(
    @Inject('IAdminRepository') private readonly adminRepository: IAdminRepository,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: AssistantShiftAssistantListQueryDto) {
    const pagination = query.toAssistantPaginationOptions()
    const { data: assistants, total } = await this.adminRepository.findAllWithPagination({
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      search: query.search,
      roleId: ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    })
    const response = assistants.map((assistant) => AdminResponseDto.fromUserWithAdmin(assistant.user, assistant))

    await this.attachAvatarUrls(response)

    return PaginationResponseDto.success(
      'Lấy danh sách trợ giảng thành công',
      response,
      pagination.page,
      pagination.limit,
      total,
    )
  }

  private async attachAvatarUrls(assistants: AdminResponseDto[]): Promise<void> {
    const userIds = assistants.map((assistant) => assistant.userId)
    if (userIds.length === 0) return

    const usages = await this.mediaUsageRepository.findByEntities(EntityType.USER, userIds, USER_MEDIA_FIELDS.AVATAR)
    const mediaByUserId = new Map<number, (typeof usages)[number]['media']>()
    for (const usage of usages) {
      if (usage.media?.status === MediaStatus.READY && !mediaByUserId.has(usage.entityId)) {
        mediaByUserId.set(usage.entityId, usage.media)
      }
    }

    const avatarUrlByUserId = new Map<number, string>()
    await Promise.all(
      [...mediaByUserId].map(async ([userId, media]) => {
        if (!media) return

        try {
          avatarUrlByUserId.set(
            userId,
            await this.minioService.getPresignedUrl(media.bucketName, media.objectKey, 3600 * 24),
          )
        } catch {
          // Avatar is optional and a failed presign must not fail the list API.
        }
      }),
    )

    for (const assistant of assistants) {
      assistant.avatarUrl = avatarUrlByUserId.get(assistant.userId)
    }
  }
}
