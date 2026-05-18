import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteTagUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(tagId: number): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.tagRepository.findById(tagId)
      if (!existing) {
        throw new NotFoundException('Khong tim thay tag')
      }

      await repos.tagRepository.delete(tagId)
    })

    return BaseResponseDto.success('Xoa tag thanh cong', {
      deleted: true,
      message: 'Xoa tag thanh cong',
    })
  }
}
