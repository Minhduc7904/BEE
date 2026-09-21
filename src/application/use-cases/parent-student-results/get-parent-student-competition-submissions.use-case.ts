import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import {
  ParentCompetitionSubmissionListItemDto,
  ParentStudentResultCursorQueryDto,
} from '../../dtos/parent-student-results'
import { CursorPageResponseDto } from '../../dtos/pagination/cursor-page-response.dto'
import { assertParentManagesStudent } from './parent-student-results-access'

@Injectable()
export class GetParentStudentCompetitionSubmissionsUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentStudentResultCursorQueryDto,
  ): Promise<CursorPageResponseDto<ParentCompetitionSubmissionListItemDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)
    const pagination = query.toPagination()
    const result = await this.results.listStandaloneCompetitionSubmissions(studentId, pagination)
    return CursorPageResponseDto.success(
      'Lấy danh sách cuộc thi đã nộp thành công',
      result.data.map(ParentCompetitionSubmissionListItemDto.fromResult),
      result.hasNext,
      result.nextCursor,
      pagination.limit,
    )
  }
}
