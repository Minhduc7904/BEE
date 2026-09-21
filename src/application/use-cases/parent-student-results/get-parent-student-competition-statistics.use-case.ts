import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import { ParentSubmissionStatisticsDto } from '../../dtos/parent-student-results'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { assertParentManagesStudent } from './parent-student-results-access'

@Injectable()
export class GetParentStudentCompetitionStatisticsUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
  ): Promise<BaseResponseDto<ParentSubmissionStatisticsDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)
    const statistics = await this.results.getStandaloneCompetitionSubmissionStatistics(studentId)
    return BaseResponseDto.success(
      'Lấy thống kê cuộc thi đã nộp thành công',
      ParentSubmissionStatisticsDto.fromResult(statistics),
    )
  }
}
