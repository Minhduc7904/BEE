import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ChapterResponseDto, PaginationResponseDto } from '../../dtos'

@Injectable()
export class GetRootChaptersUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    subjectId?: number,
    page: number = 1,
    limit: number = 100,
  ): Promise<PaginationResponseDto<ChapterResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const chapterRepository = repos.chapterRepository

      // Get root chapters (chapters without parent)
      const { data, total } = await chapterRepository.findAllWithPagination({
        skip: (page - 1) * limit,
        take: limit,
        parentChapterId: null, // Get only root chapters
        subjectId,
        sortBy: 'orderInParent',
        sortOrder: 'asc',
      })

      const chapters = ChapterResponseDto.fromChapterList(data)
      const totalPages = Math.ceil(total / limit)

      return {
        data: chapters,
        total,
        page,
        limit,
        totalPages,
      }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách chương gốc thành công',
      result.data,
      result.page,
      result.limit,
      result.total,
    )
  }
}
