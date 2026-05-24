import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
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

      await repos.teacherProfileRepository.delete(teacherProfileId)
    })

    return BaseResponseDto.success('Xoa ho so giao vien thanh cong', {
      deleted: true,
      message: 'Xoa ho so giao vien thanh cong',
    })
  }
}
