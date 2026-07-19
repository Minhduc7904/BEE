import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class BackfillQuestionDefaultPointsUseCase {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(): Promise<
    BaseResponseDto<Awaited<ReturnType<IQuestionRepository['backfillDefaultPointsForUnscored']>>>
  > {
    const result = await this.questionRepository.backfillDefaultPointsForUnscored()

    return BaseResponseDto.success('Cap nhat diem mac dinh cho cau hoi thanh cong', result)
  }
}
