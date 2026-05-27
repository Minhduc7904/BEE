import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteTeacherProfileUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(teacherProfileId: number): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.teacherProfileRepository.findById(teacherProfileId)
      if (!existing) {
        throw new NotFoundException('Khong tim thay ho so giao vien')
      }

      const usages = await repos.mediaUsageRepository.findByEntity(EntityType.TEACHER_PROFILE, teacherProfileId)
      const mediaIds = Array.from(new Set(usages.map((usage) => usage.mediaId)))

      for (const usage of usages) {
        await repos.mediaUsageRepository.detach(usage.usageId)
      }

      await repos.teacherProfileRepository.delete(teacherProfileId)

      for (const mediaId of mediaIds) {
        const remainingUsageCount = await repos.mediaUsageRepository.countByMedia(mediaId)
        if (remainingUsageCount === 0) {
          await repos.mediaRepository.softDelete(mediaId)
        }
      }
    })

    return BaseResponseDto.success('Xoa ho so giao vien thanh cong', {
      deleted: true,
      message: 'Xoa ho so giao vien thanh cong',
    })
  }
}
