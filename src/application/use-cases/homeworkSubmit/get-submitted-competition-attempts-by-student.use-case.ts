import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionSubmitResponseDto } from '../../dtos/competition-submit/competition-submit.dto'

@Injectable()
export class GetSubmittedCompetitionAttemptsByStudentUseCase {
  constructor(
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
  ) {}

  async execute(studentId: number): Promise<BaseResponseDto<any>> {
    const competitionSubmits = (await this.competitionSubmitRepository.findByStudent(studentId))
      .filter((attempt) => attempt.status === CompetitionSubmitStatus.SUBMITTED)
      .sort(
        (left, right) =>
          new Date(right.submittedAt ?? right.createdAt).getTime() -
          new Date(left.submittedAt ?? left.createdAt).getTime(),
      )

    return BaseResponseDto.success('Lấy danh sách lượt thi đã nộp thành công', {
      studentId,
      total: competitionSubmits.length,
      competitionSubmits: competitionSubmits.map(CompetitionSubmitResponseDto.fromEntity),
    })
  }
}
