import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TagResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetTagByIdUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(tagId: number): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.unitOfWork.executeInTransaction((repos) =>
      repos.tagRepository.findById(tagId),
    )

    if (!tag) {
      throw new NotFoundException('Khong tim thay tag')
    }

    return BaseResponseDto.success('Lay tag thanh cong', TagResponseDto.fromEntity(tag))
  }
}
