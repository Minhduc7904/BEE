import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import { ParentMonthQueryDto } from '../../dtos/parent-student-dashboard'
import { ParentResultsSummaryDto } from '../../dtos/parent-student-results'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { getVietnamMonthRange } from '../../../shared/utils/vietnam-month.util'
import { assertParentManagesStudent } from './parent-student-results-access'
import { summarizeMonthlyResults } from './summarize-monthly-results'

@Injectable()
export class GetParentStudentResultsSummaryUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentMonthQueryDto,
  ): Promise<BaseResponseDto<ParentResultsSummaryDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)

    const { start, endExclusive } = getVietnamMonthRange(query.month, query.year)
    const items = await this.results.listMonthlyResults(studentId, start, endExclusive)

    return BaseResponseDto.success(
      'Lấy tổng quan kết quả học tập thành công',
      ParentResultsSummaryDto.fromResult(summarizeMonthlyResults(query.month, query.year, items)),
    )
  }
}
