// src/application/use-cases/student/get-all-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IStudentRepository } from '../../../domain/repositories/student.repository'
import { StudentListQueryDto } from '../../dtos/student/student-list-query.dto'
import { StudentListResponseDto, StudentResponseDto } from '../../dtos/student/student.dto'

@Injectable()
export class GetAllStudentUseCase {
  constructor(@Inject('IStudentRepository') private readonly studentRepository: IStudentRepository) {}

  async execute(query: StudentListQueryDto): Promise<StudentListResponseDto> {
    const filters = query.toStudentFilterOptions()
    const pagination = query.toStudentPaginationOptions()

    const result = await this.studentRepository.findByFilters(filters, pagination)
    const students = result.data.map(StudentResponseDto.fromStudentEntity)

    return StudentListResponseDto.success(
      'Lấy danh sách học sinh thành công',
      students,
      result.page,
      result.limit,
      result.total,
    )
  }
}
