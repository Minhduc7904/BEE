import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentResultsReadService } from '../../interfaces'
import { ParentHomeworkSubmissionDetailDto } from '../../dtos/parent-student-results'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { assertParentManagesStudent } from './parent-student-results-access'

@Injectable()
export class GetParentStudentHomeworkSubmissionDetailUseCase {
  constructor(private readonly results: ParentStudentResultsReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    homeworkSubmitId: number,
  ): Promise<BaseResponseDto<ParentHomeworkSubmissionDetailDto>> {
    await assertParentManagesStudent(identity, studentId, this.results)
    const detail = await this.results.getHomeworkSubmissionDetail(studentId, homeworkSubmitId)
    if (!detail) throw new NotFoundException('Không tìm thấy bài tập đã nộp')
    return BaseResponseDto.success(
      'Lấy chi tiết bài tập đã nộp thành công',
      ParentHomeworkSubmissionDetailDto.fromResult(detail),
    )
  }
}
