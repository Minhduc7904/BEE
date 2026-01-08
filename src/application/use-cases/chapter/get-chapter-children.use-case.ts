import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ChapterResponseDto, PaginationResponseDto } from '../../dtos'

@Injectable()
export class GetChapterChildrenUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    parentId: number,
    page: number = 1,
    limit: number = 100,
  ): Promise<PaginationResponseDto<ChapterResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const chapterRepository = repos.chapterRepository

      // Verify parent chapter exists
      const parentChapter = await chapterRepository.findById(parentId)
      if (!parentChapter) {
        throw new NotFoundException(`Chapter with ID ${parentId} not found`)
      }

      // Get children of this chapter
      const { data, total } = await chapterRepository.findAllWithPagination({
        skip: (page - 1) * limit,
        take: limit,
        parentChapterId: parentId,
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
      'Lấy danh sách chương con thành công',
      result.data,
      result.page,
      result.limit,
      result.total,
    )
  }
}
