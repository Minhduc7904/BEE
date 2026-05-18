import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteDocumentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(documentId: number): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.documentRepository.findById(documentId)
      if (!existing) {
        throw new NotFoundException('Khong tim thay tai lieu')
      }

      const usages = await repos.mediaUsageRepository.findByEntity(EntityType.DOCUMENT, documentId)
      const mediaIds = Array.from(new Set(usages.map((usage) => usage.mediaId)))

      for (const usage of usages) {
        await repos.mediaUsageRepository.detach(usage.usageId)
      }

      for (const mediaId of mediaIds) {
        const remainingUsageCount = await repos.mediaUsageRepository.countByMedia(mediaId)
        if (remainingUsageCount === 0) {
          await repos.mediaRepository.softDelete(mediaId)
        }
      }

      await repos.documentRepository.delete(documentId)
    })

    return BaseResponseDto.success('Xoa tai lieu thanh cong', {
      deleted: true,
      message: 'Xoa tai lieu thanh cong',
    })
  }
}
