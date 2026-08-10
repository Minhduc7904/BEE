import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, BookCategoryDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'

@Injectable()
export class GetBookCategoriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(isActive?: boolean): Promise<BaseResponseDto<BookCategoryDto[]>> {
    const categories = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bookCategoryRepository.findAll({ isActive }),
    )
    return BaseResponseDto.success('Lấy danh sách loại sách thành công', BookCategoryDto.fromEntityList(categories))
  }
}
