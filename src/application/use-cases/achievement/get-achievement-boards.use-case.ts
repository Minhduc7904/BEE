import { Inject, Injectable } from '@nestjs/common'
import { AchievementBoardListQueryDto, AchievementBoardResponseDto, PaginationResponseDto } from 'src/application/dtos'
import type { IAchievementBoardRepository } from 'src/domain/repositories'

@Injectable()
export class GetAchievementBoardsUseCase {
  constructor(
    @Inject('IAchievementBoardRepository')
    private readonly achievementBoardRepository: IAchievementBoardRepository,
  ) {}

  async execute(query: AchievementBoardListQueryDto): Promise<PaginationResponseDto<AchievementBoardResponseDto>> {
    const pagination = query.toAchievementBoardPaginationOptions()
    const result = await this.achievementBoardRepository.findAllWithPagination({
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      search: query.search,
      visibility: query.visibility,
      isFeatured: query.isFeatured,
      includeRows: query.includeRows ?? true,
    })

    return PaginationResponseDto.success(
      'Lay danh sach bang thanh tich thanh cong',
      AchievementBoardResponseDto.fromEntityList(result.data),
      pagination.page,
      pagination.limit,
      result.total,
    )
  }
}
