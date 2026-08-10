import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookResponseDto } from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { attachBookMedia } from './book-media.helper'

@Injectable()
export class GetBookByIdUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(bookId: number): Promise<BaseResponseDto<BookResponseDto>> {
    const book = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bookRepository.findById(bookId, { includeCategories: true }),
    )
    if (!book) {
      throw new NotFoundException('Không tìm thấy sách')
    }
    const response = BookResponseDto.fromEntity(book)
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Lấy chi tiết sách thành công', response)
  }
}
