import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TeacherProfileResponseDto, UpdateTeacherProfileDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { generateUniqueTeacherProfileSlug } from './teacher-profile-slug.util'

@Injectable()
export class UpdateTeacherProfileUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    teacherProfileId: number,
    dto: UpdateTeacherProfileDto,
    userId?: number,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    const teacherProfile = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.teacherProfileRepository.findById(teacherProfileId)
      if (!existing) {
        throw new NotFoundException('Khong tim thay ho so giao vien')
      }

      const updateData: any = { ...dto }

      if (dto.displayName && dto.displayName !== existing.displayName) {
        updateData.slug = await generateUniqueTeacherProfileSlug(
          dto.displayName,
          repos.teacherProfileRepository,
          existing.teacherProfileId,
          existing.slug,
        )
      }

      return repos.teacherProfileRepository.update(teacherProfileId, {
        ...updateData,
        updatedBy: userId ?? null,
      })
    })

    return BaseResponseDto.success(
      'Cap nhat ho so giao vien thanh cong',
      TeacherProfileResponseDto.fromEntity(teacherProfile),
    )
  }
}
