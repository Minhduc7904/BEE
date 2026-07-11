import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import {
  StudentPointLogMutationResponseDto,
  UpdateStudentPointLogDto,
} from 'src/application/dtos/student/student-point-log.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateStudentPointLogUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    pointLogId: number,
    dto: UpdateStudentPointLogDto,
  ): Promise<BaseResponseDto<StudentPointLogMutationResponseDto>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.studentPointLogRepository.findById(pointLogId)
      if (!existing) {
        throw new NotFoundException(`Log diem voi ID ${pointLogId} khong ton tai`)
      }

      const updated = await repos.studentPointLogRepository.updateAndApply(pointLogId, {
        type: dto.type,
        points: dto.points,
        source: dto.source,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        note: dto.note,
        metadata: dto.metadata,
      })

      const student = await repos.studentRepository.findById(updated.studentId)
      return BaseResponseDto.success(
        'Cap nhat log diem thanh cong',
        new StudentPointLogMutationResponseDto(updated, student?.totalPoint ?? 0),
      )
    })
  }
}
