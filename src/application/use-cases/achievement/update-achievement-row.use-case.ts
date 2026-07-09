import { Inject, Injectable } from '@nestjs/common'
import { AchievementRowResponseDto, BaseResponseDto, UpdateAchievementRowDto } from 'src/application/dtos'
import type { IAchievementBoardRepository } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateAchievementRowUseCase {
  constructor(
    @Inject('IAchievementBoardRepository')
    private readonly achievementBoardRepository: IAchievementBoardRepository,
  ) {}

  async execute(
    achievementRowId: number,
    dto: UpdateAchievementRowDto,
  ): Promise<BaseResponseDto<AchievementRowResponseDto>> {
    const existed = await this.achievementBoardRepository.findRowById(achievementRowId)
    if (!existed) {
      throw new NotFoundException('Khong tim thay dong thanh tich')
    }

    const row = await this.achievementBoardRepository.updateRow(achievementRowId, dto)
    return BaseResponseDto.success('Cap nhat dong thanh tich thanh cong', AchievementRowResponseDto.fromEntity(row))
  }
}
