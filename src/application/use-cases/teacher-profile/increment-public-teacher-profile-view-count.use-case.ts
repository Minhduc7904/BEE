import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { Visibility } from 'src/shared/enums'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class IncrementPublicTeacherProfileViewCountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(slug: string): Promise<BaseResponseDto<{ viewCount: number }>> {
    const teacherProfile = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.teacherProfileRepository.findBySlug(slug)
      if (!existing || existing.visibility !== Visibility.PUBLISHED) {
        throw new NotFoundException('Khong tim thay ho so giao vien')
      }

      return repos.teacherProfileRepository.incrementViewCount(existing.teacherProfileId)
    })

    return BaseResponseDto.success('Tang luot xem ho so giao vien thanh cong', {
      viewCount: teacherProfile.viewCount,
    })
  }
}
