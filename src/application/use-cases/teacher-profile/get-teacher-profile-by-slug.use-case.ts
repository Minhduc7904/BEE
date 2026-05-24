import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TeacherProfileResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetTeacherProfileBySlugUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(slug: string): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    const teacherProfile = await this.unitOfWork.executeInTransaction((repos) =>
      repos.teacherProfileRepository.findBySlug(slug),
    )

    if (!teacherProfile) {
      throw new NotFoundException('Khong tim thay ho so giao vien')
    }

    return BaseResponseDto.success(
      'Lay ho so giao vien thanh cong',
      TeacherProfileResponseDto.fromEntity(teacherProfile),
    )
  }
}
