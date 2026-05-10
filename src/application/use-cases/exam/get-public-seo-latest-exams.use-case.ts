import { Injectable } from '@nestjs/common'
import { PublicStudentExamListQueryDto, PublicStudentExamListResponseDto } from '../../dtos/exam'
import { GetPublicStudentExamsUseCase } from './get-public-student-exams.use-case'

@Injectable()
export class GetPublicSeoLatestExamsUseCase {
  constructor(
    private readonly getPublicStudentExamsUseCase: GetPublicStudentExamsUseCase,
  ) {}

  async execute(limit = 4): Promise<PublicStudentExamListResponseDto> {
    const query = {
      page: 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as PublicStudentExamListQueryDto

    const response = await this.getPublicStudentExamsUseCase.execute(query, undefined, {
      renderDescriptionHtml: true,
    })

    const latestItems = (response.data || []).slice(0, limit)

    return PublicStudentExamListResponseDto.fromResult(
      latestItems,
      1,
      limit,
      latestItems.length,
    )
  }
}
