import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { Visibility } from 'src/shared/enums'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class IncrementPublicDocumentDownloadCountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(slug: string): Promise<BaseResponseDto<{ downloadCount: number }>> {
    const document = await this.increment(slug)

    return BaseResponseDto.success('Tang luot tai tai lieu thanh cong', {
      downloadCount: document.downloadCount,
    })
  }

  async increment(slug: string) {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.documentRepository.findBySlug(slug)
      if (!existing || existing.visibility !== Visibility.PUBLISHED) {
        throw new NotFoundException('Khong tim thay tai lieu')
      }

      return repos.documentRepository.incrementDownloadCount(existing.documentId)
    })
  }
}
