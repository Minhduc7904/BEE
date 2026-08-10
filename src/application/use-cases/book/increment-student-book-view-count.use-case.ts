import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { assertStudentBookAccess } from './student-book-access.util'

@Injectable()
export class IncrementStudentBookViewCountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(studentId: number | undefined, slug: string): Promise<BaseResponseDto<{ viewCount: number }>> {
    assertStudentBookAccess(studentId)

    const book = await this.unitOfWork.executeInTransaction(async (repos) => {
      const found = await repos.bookRepository.findBySlug(slug)
      if (!found || !found.isPublished()) {
        throw new NotFoundException('Không tìm thấy sách dành cho học sinh')
      }
      return repos.bookRepository.incrementViewCount(found.bookId)
    })

    return BaseResponseDto.success('Tăng lượt xem sách dành cho học sinh thành công', {
      viewCount: book.viewCount,
    })
  }
}
