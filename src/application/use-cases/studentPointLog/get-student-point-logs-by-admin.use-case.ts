import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { StudentPointLogListQueryDto, StudentPointLogListResponseDto } from 'src/application/dtos/student/student-point-log.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetStudentPointLogsByAdminUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(studentId: number, query: StudentPointLogListQueryDto): Promise<StudentPointLogListResponseDto> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const student = await repos.studentRepository.findById(studentId)
      if (!student) {
        throw new NotFoundException(`Hoc sinh voi ID ${studentId} khong ton tai`)
      }

      const pagination = query.toPaginationOptions()
      const result = await repos.studentPointLogRepository.findByStudent(
        studentId,
        pagination,
        query.toFilterOptions(studentId),
      )

      return new StudentPointLogListResponseDto(
        result.data,
        pagination.page || 1,
        pagination.limit || 10,
        result.total,
        student.totalPoint,
      )
    })
  }
}
