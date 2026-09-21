import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import { ParentHomeworkSubmissionListItemDto, ParentStudentResultListQueryDto } from '../../dtos/parent-student-results'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'
import { assertParentManagesStudent } from './parent-student-results-access'

@Injectable()
export class GetParentStudentHomeworkSubmissionsUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentStudentResultListQueryDto,
  ): Promise<PaginationResponseDto<ParentHomeworkSubmissionListItemDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)
    const result = await this.results.listHomeworkSubmissions(studentId, query.toPagination())
    return PaginationResponseDto.success(
      'Lấy danh sách bài tập đã nộp thành công',
      result.data.map(ParentHomeworkSubmissionListItemDto.fromResult),
      result.page,
      result.limit,
      result.total,
    )
  }
}
