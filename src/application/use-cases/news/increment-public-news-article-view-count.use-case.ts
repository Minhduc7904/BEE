import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { Visibility } from 'src/shared/enums'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class IncrementPublicNewsArticleViewCountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(slug: string): Promise<BaseResponseDto<{ viewCount: number }>> {
    const newsArticle = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.newsArticleRepository.findBySlug(slug)
      if (!existing || existing.visibility !== Visibility.PUBLISHED) {
        throw new NotFoundException('Khong tim thay bai viet tin tuc')
      }

      return repos.newsArticleRepository.incrementViewCount(existing.newsArticleId)
    })

    return BaseResponseDto.success('Tang luot xem bai viet tin tuc thanh cong', {
      viewCount: newsArticle.viewCount,
    })
  }
}
