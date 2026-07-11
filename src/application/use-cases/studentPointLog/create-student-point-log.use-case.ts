import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import {
  CreateStudentPointLogDto,
  StudentPointLogMutationResponseDto,
} from 'src/application/dtos/student/student-point-log.dto'
import { StudentPointService } from 'src/application/services/student-point.service'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class CreateStudentPointLogUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly studentPointService: StudentPointService,
  ) {}

  async execute(dto: CreateStudentPointLogDto): Promise<BaseResponseDto<StudentPointLogMutationResponseDto>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const student = await repos.studentRepository.findById(dto.studentId)
      if (!student) {
        throw new NotFoundException(`Hoc sinh voi ID ${dto.studentId} khong ton tai`)
      }

      const pointLog = await this.studentPointService.createStudentPointLog(repos, {
        studentId: dto.studentId,
        type: dto.type,
        points: dto.points,
        source: dto.source,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        note: dto.note,
        metadata: dto.metadata,
      })

      const updatedStudent = await repos.studentRepository.findById(dto.studentId)

      return BaseResponseDto.success(
        'Tao log diem thanh cong',
        new StudentPointLogMutationResponseDto(pointLog, updatedStudent?.totalPoint ?? 0),
      )
    })
  }
}
