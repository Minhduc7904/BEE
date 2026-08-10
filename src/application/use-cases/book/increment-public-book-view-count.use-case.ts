import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'

@Injectable()
export class IncrementPublicBookViewCountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(slug: string): Promise<BaseResponseDto<{ viewCount: number }>> {
    const book = await this.unitOfWork.executeInTransaction(async (repos) => {
      const found = await repos.bookRepository.findBySlug(slug)
      if (!found || !found.isPublished()) {
        throw new NotFoundException('Không tìm thấy sách công khai')
      }
      return repos.bookRepository.incrementViewCount(found.bookId)
    })
    return BaseResponseDto.success('Tăng lượt xem sách thành công', { viewCount: book.viewCount })
  }
}
