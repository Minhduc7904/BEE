import { Inject, Injectable } from '@nestjs/common'
import { BookListQueryDto, BookResponseDto, PaginationResponseDto } from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { attachBookMediaToResponses } from './book-media.helper'

@Injectable()
export class GetBooksUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: BookListQueryDto): Promise<PaginationResponseDto<BookResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const pagination = query.toBookPaginationOptions()
      const { data, total } = await repos.bookRepository.findAllWithPagination({
        ...pagination,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        search: query.search,
        visibility: query.visibility,
        isFeatured: query.isFeatured,
        categorySlugs: query.getCategorySlugs(),
        includeCategories: true,
      })
      return { data, total, pagination }
    })
    const response = result.data.map((book) => BookResponseDto.fromListEntity(book))
    await attachBookMediaToResponses(this.unitOfWork, this.minioService, response)
    return PaginationResponseDto.success(
      'Lấy danh sách sách thành công',
      response,
      result.pagination.page,
      result.pagination.limit,
      result.total,
    )
  }
}
