import { Injectable, Inject } from '@nestjs/common'
import { PaginationResponseDto, ChapterListQueryDto, ChapterResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetAllChaptersUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: ChapterListQueryDto): Promise<PaginationResponseDto<ChapterResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const chapterRepository = repos.chapterRepository

      // Validate sort fields
      if (!query.validateChapterSortFields()) {
        throw new Error('Trường sắp xếp không hợp lệ')
      }

      const paginationOptions = query.toChapterPaginationOptions()
      const filterOptions = query.toChapterFilterOptions()

      const { data, total } = await chapterRepository.findAllWithPagination({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        sortBy: paginationOptions.sortBy,
        sortOrder: paginationOptions.sortOrder,
        search: filterOptions.search,
        subjectId: filterOptions.subjectId,
        parentChapterId: filterOptions.parentChapterId,
        level: filterOptions.level,
      })

      const chapters = ChapterResponseDto.fromChapterList(data)

      return {
        data: chapters,
        total,
        page: paginationOptions.page,
        limit: paginationOptions.limit,
        totalPages: Math.ceil(total / paginationOptions.limit),
      }
    })

    return PaginationResponseDto.success(
        'Lấy danh sách chương thành công', 
        result.data,
        result.page,
        result.limit,
        result.total,
    )
  }
}
