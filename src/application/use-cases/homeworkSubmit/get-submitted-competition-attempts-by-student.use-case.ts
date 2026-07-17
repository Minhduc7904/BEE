import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
  SubmittedCompetitionAttemptBasicDto,
  SubmittedCompetitionAttemptsByStudentResponseDto,
} from '../../dtos/competition-submit/submitted-competition-attempt-basic.dto'

@Injectable()
export class GetSubmittedCompetitionAttemptsByStudentUseCase {
  constructor(
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
  ) {}

  async execute(
    studentId: number,
  ): Promise<BaseResponseDto<SubmittedCompetitionAttemptsByStudentResponseDto>> {
    const competitionSubmits = await this.competitionSubmitRepository.findSubmittedBasicByStudent(studentId)

    return BaseResponseDto.success('Lấy danh sách lượt thi đã nộp thành công', {
      studentId,
      total: competitionSubmits.length,
      competitionSubmits: competitionSubmits.map(SubmittedCompetitionAttemptBasicDto.fromEntity),
    })
  }
}
