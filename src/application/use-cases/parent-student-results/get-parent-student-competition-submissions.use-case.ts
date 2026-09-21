import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import {
  ParentCompetitionSubmissionListItemDto,
  ParentStudentResultListQueryDto,
} from '../../dtos/parent-student-results'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'
import { assertParentManagesStudent } from './parent-student-results-access'

@Injectable()
export class GetParentStudentCompetitionSubmissionsUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentStudentResultListQueryDto,
  ): Promise<PaginationResponseDto<ParentCompetitionSubmissionListItemDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)
    const result = await this.results.listStandaloneCompetitionSubmissions(studentId, query.toPagination())
    return PaginationResponseDto.success(
      'Lấy danh sách cuộc thi đã nộp thành công',
      result.data.map(ParentCompetitionSubmissionListItemDto.fromResult),
      result.page,
      result.limit,
      result.total,
    )
  }
}
