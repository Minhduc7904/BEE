import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IAchievementBoardRepository } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteAchievementRowUseCase {
  constructor(
    @Inject('IAchievementBoardRepository')
    private readonly achievementBoardRepository: IAchievementBoardRepository,
  ) {}

  async execute(achievementRowId: number): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    const existed = await this.achievementBoardRepository.findRowById(achievementRowId)
    if (!existed) {
      throw new NotFoundException('Khong tim thay dong thanh tich')
    }

    await this.achievementBoardRepository.deleteRow(achievementRowId)

    return BaseResponseDto.success('Xoa dong thanh tich thanh cong', {
      deleted: true,
      message: 'Xoa dong thanh tich thanh cong',
    })
  }
}
