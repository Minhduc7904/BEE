import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TeacherProfileResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetTeacherProfileByIdUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(teacherProfileId: number): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    const teacherProfile = await this.unitOfWork.executeInTransaction((repos) =>
      repos.teacherProfileRepository.findById(teacherProfileId),
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
