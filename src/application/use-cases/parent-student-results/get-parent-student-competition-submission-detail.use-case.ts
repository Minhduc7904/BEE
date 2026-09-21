import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import { ParentCompetitionSubmissionDetailDto } from '../../dtos/parent-student-results'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { assertParentManagesStudent } from './parent-student-results-access'

@Injectable()
export class GetParentStudentCompetitionSubmissionDetailUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    competitionSubmitId: number,
  ): Promise<BaseResponseDto<ParentCompetitionSubmissionDetailDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)
    const detail = await this.results.getStandaloneCompetitionSubmissionDetail(studentId, competitionSubmitId)
    if (!detail) throw new NotFoundException('Không tìm thấy lượt thi độc lập đã nộp')
    return BaseResponseDto.success(
      'Lấy chi tiết cuộc thi đã nộp thành công',
      ParentCompetitionSubmissionDetailDto.fromResult(detail),
    )
  }
}
