import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IAchievementBoardRepository } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteAchievementBoardUseCase {
  constructor(
    @Inject('IAchievementBoardRepository')
    private readonly achievementBoardRepository: IAchievementBoardRepository,
  ) {}

  async execute(achievementBoardId: number): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    const existed = await this.achievementBoardRepository.findById(achievementBoardId, false)
    if (!existed) {
      throw new NotFoundException('Khong tim thay bang thanh tich')
    }

    await this.achievementBoardRepository.delete(achievementBoardId)

    return BaseResponseDto.success('Xoa bang thanh tich thanh cong', {
      deleted: true,
      message: 'Xoa bang thanh tich thanh cong',
    })
  }
}
