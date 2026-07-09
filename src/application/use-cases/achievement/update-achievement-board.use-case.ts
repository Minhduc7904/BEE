import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, UpdateAchievementBoardDto, AchievementBoardResponseDto } from 'src/application/dtos'
import type { IAchievementBoardRepository } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { generateUniqueAchievementBoardSlug } from './achievement-board-slug.util'

@Injectable()
export class UpdateAchievementBoardUseCase {
  constructor(
    @Inject('IAchievementBoardRepository')
    private readonly achievementBoardRepository: IAchievementBoardRepository,
  ) {}

  async execute(
    achievementBoardId: number,
    dto: UpdateAchievementBoardDto,
    userId?: number,
  ): Promise<BaseResponseDto<AchievementBoardResponseDto>> {
    const existed = await this.achievementBoardRepository.findById(achievementBoardId, false)
    if (!existed) {
      throw new NotFoundException('Khong tim thay bang thanh tich')
    }

    const updateData: any = { ...dto, updatedBy: userId ?? null }
    if (dto.slug || dto.title) {
      updateData.slug = await generateUniqueAchievementBoardSlug(
        dto.slug || dto.title || existed.title,
        this.achievementBoardRepository,
        achievementBoardId,
        existed.slug,
      )
    }

    const board = await this.achievementBoardRepository.update(achievementBoardId, updateData)

    return BaseResponseDto.success('Cap nhat bang thanh tich thanh cong', AchievementBoardResponseDto.fromEntity(board))
  }
}
