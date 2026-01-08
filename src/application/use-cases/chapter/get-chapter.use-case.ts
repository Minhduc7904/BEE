import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, ChapterDetailResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetChapterUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(id: number): Promise<BaseResponseDto<ChapterDetailResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const chapterRepository = repos.chapterRepository

      const chapter = await chapterRepository.findById(id)

      if (!chapter) {
        throw new NotFoundException(`Không tìm thấy chương với ID ${id}`)
      }

      return ChapterDetailResponseDto.fromChapterWithChildren(chapter)
    })

    return BaseResponseDto.success('Lấy thông tin chương thành công', result)
  }
}
