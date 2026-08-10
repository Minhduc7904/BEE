import { Inject, Injectable } from '@nestjs/common'
import { BookResponseDto, PaginationResponseDto, StudentBookListQueryDto } from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { Visibility } from 'src/shared/enums'
import { attachBookMediaToResponses } from './book-media.helper'
import { assertStudentBookAccess } from './student-book-access.util'

@Injectable()
export class GetStudentBooksUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    studentId: number | undefined,
    query: StudentBookListQueryDto,
  ): Promise<PaginationResponseDto<BookResponseDto>> {
    assertStudentBookAccess(studentId)

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const pagination = query.toBookPaginationOptions()
      const { data, total } = await repos.bookRepository.findAllWithPagination({
        ...pagination,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        search: query.search,
        visibility: Visibility.PUBLISHED,
        isFeatured: query.isFeatured,
        categorySlugs: query.getCategorySlugs(),
        includeCategories: true,
      })
      return { data, total, pagination }
    })

    const response = result.data.map((book) => BookResponseDto.fromListEntity(book))
    await attachBookMediaToResponses(this.unitOfWork, this.minioService, response)
    return PaginationResponseDto.success(
      'Lấy danh sách sách dành cho học sinh thành công',
      response,
      result.pagination.page,
      result.pagination.limit,
      result.total,
    )
  }
}
