import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import { ParentHomeworkSubmissionListItemDto, ParentStudentResultCursorQueryDto } from '../../dtos/parent-student-results'
import { CursorPageResponseDto } from '../../dtos/pagination/cursor-page-response.dto'
import { assertParentManagesStudent } from './parent-student-results-access'

@Injectable()
export class GetParentStudentHomeworkSubmissionsUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentStudentResultCursorQueryDto,
  ): Promise<CursorPageResponseDto<ParentHomeworkSubmissionListItemDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)
    const pagination = query.toPagination()
    const result = await this.results.listHomeworkSubmissions(studentId, pagination)
    return CursorPageResponseDto.success(
      'Lấy danh sách bài tập đã nộp thành công',
      result.data.map(ParentHomeworkSubmissionListItemDto.fromResult),
      result.hasNext,
      result.nextCursor,
      pagination.limit,
    )
  }
}
