import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { UpdateTempQuestionPointsBySectionDto } from '../../dtos/temp-question/update-temp-question-points-by-section.dto'
import type { ITempQuestionRepository } from '../../../domain/repositories/temp-question.repository'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'

@Injectable()
export class UpdateTempQuestionPointsBySectionUseCase {
  constructor(
    @Inject('ITempQuestionRepository')
    private readonly tempQuestionRepository: ITempQuestionRepository,
    @Inject('ITempSectionRepository')
    private readonly tempSectionRepository: ITempSectionRepository,
  ) {}

  async execute(
    tempSectionId: number,
    dto: UpdateTempQuestionPointsBySectionDto,
  ): Promise<BaseResponseDto<{ tempSectionId: number; pointsOrigin: number; updatedCount: number }>> {
    const tempSection = await this.tempSectionRepository.findById(tempSectionId)
    if (!tempSection) {
      throw new NotFoundException('Khong tim thay temp section')
    }

    const updatedCount = await this.tempQuestionRepository.updatePointsByTempSectionId(
      tempSectionId,
      dto.pointsOrigin,
    )

    return BaseResponseDto.success('Cap nhat diem cho tat ca cau hoi trong temp section thanh cong', {
      tempSectionId,
      pointsOrigin: dto.pointsOrigin,
      updatedCount,
    })
  }
}
