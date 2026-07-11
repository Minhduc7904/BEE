import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteNewsArticleUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(newsArticleId: number): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.newsArticleRepository.findById(newsArticleId)
      if (!existing) throw new NotFoundException('Khong tim thay bai viet tin tuc')

      await repos.mediaUsageRepository.detachByEntity(EntityType.NEWS_ARTICLE, newsArticleId)
      await repos.newsArticleRepository.delete(newsArticleId)
    })

    return BaseResponseDto.success('Xoa bai viet tin tuc thanh cong', {
      deleted: true,
      message: 'Xoa bai viet tin tuc thanh cong',
    })
  }
}
