import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, BookCategoryDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { assertStudentBookAccess } from './student-book-access.util'

@Injectable()
export class GetStudentBookCategoriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(studentId: number | undefined): Promise<BaseResponseDto<BookCategoryDto[]>> {
    assertStudentBookAccess(studentId)

    const categories = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bookCategoryRepository.findAll({ isActive: true }),
    )
    return BaseResponseDto.success(
      'Lấy loại sách dành cho học sinh thành công',
      BookCategoryDto.fromEntityList(categories),
    )
  }
}
