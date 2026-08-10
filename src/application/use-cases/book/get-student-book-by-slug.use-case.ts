import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookResponseDto } from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { attachBookMedia } from './book-media.helper'
import { assertStudentBookAccess } from './student-book-access.util'

@Injectable()
export class GetStudentBookBySlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(studentId: number | undefined, slug: string): Promise<BaseResponseDto<BookResponseDto>> {
    assertStudentBookAccess(studentId)

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const book = await repos.bookRepository.findBySlug(slug, { includeCategories: true })
      const contact = await repos.bookSalesContactConfigurationRepository.findCurrent()
      if (!book || !book.isPublished() || !contact) {
        throw new NotFoundException('Không tìm thấy sách dành cho học sinh')
      }
      return { book, contact }
    })

    const response = BookResponseDto.fromEntity(result.book)
    response.contact = {
      phone: result.contact.phone,
      facebookUrl: result.contact.facebookUrl,
    }
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Lấy chi tiết sách dành cho học sinh thành công', response)
  }
}
