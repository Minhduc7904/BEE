import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, BookResponseDto } from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork } from 'src/domain/repositories'
import { attachBookMedia } from './book-media.helper'

@Injectable()
export class GetPublicSeoBookBySlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(slug: string): Promise<BaseResponseDto<BookResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const book = await repos.bookRepository.findBySlug(slug, { includeCategories: true })
      const contact = await repos.bookSalesContactConfigurationRepository.findCurrent()
      if (!book || !book.isPublished() || !contact) {
        throw new NotFoundException('Không tìm thấy sách công khai')
      }
      return { book, contact }
    })
    const response = BookResponseDto.fromEntity(result.book)
    response.contact = { phone: result.contact.phone, facebookUrl: result.contact.facebookUrl }
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Lấy sách công khai thành công', response)
  }
}
