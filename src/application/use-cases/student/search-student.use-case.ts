// src/application/use-cases/student/search-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IStudentRepository } from '../../../domain/repositories/student.repository'
import { StudentSearchQueryDto } from '../../dtos/student/student-search-query.dto'
import { StudentListResponseDto, StudentResponseDto } from '../../dtos/student/student.dto'

@Injectable()
export class SearchStudentUseCase {
  constructor(
    @Inject('IStudentRepository') 
    private readonly studentRepository: IStudentRepository
  ) { }

  async execute(query: StudentSearchQueryDto): Promise<StudentListResponseDto> {
    // Get filter and pagination options from DTO
    const filters = query.toStudentFilterOptions()
    const pagination = query.toStudentPaginationOptions()

    // Fetch data with fixed pagination
    const result = await this.studentRepository.findByFilters(filters, pagination)

    // Map to response DTOs
    const students = result.data.map(StudentResponseDto.fromStudentEntity)

    return StudentListResponseDto.success(
      'Tìm kiếm học sinh thành công',
      students,
      result.page,
      result.limit,
      result.total,
    )
  }
}
