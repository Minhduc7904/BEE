import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { DeleteStudentPointLogResponseDto } from 'src/application/dtos/student/student-point-log.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteStudentPointLogUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(pointLogId: number): Promise<BaseResponseDto<DeleteStudentPointLogResponseDto>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.studentPointLogRepository.findById(pointLogId)
      if (!existing) {
        throw new NotFoundException(`Log diem voi ID ${pointLogId} khong ton tai`)
      }

      const deleted = await repos.studentPointLogRepository.deleteAndApply(pointLogId)
      const student = await repos.studentRepository.findById(deleted.studentId)

      return BaseResponseDto.success(
        'Xoa log diem thanh cong',
        new DeleteStudentPointLogResponseDto(deleted, student?.totalPoint ?? 0),
      )
    })
  }
}
