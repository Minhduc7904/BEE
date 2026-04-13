import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, ChapterResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetPublicStudentChaptersBySubjectUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(subjectId: number): Promise<BaseResponseDto<ChapterResponseDto[]>> {
    const chapters = await this.unitOfWork.executeInTransaction(async (repos) => {
      const subject = await repos.subjectRepository.findById(subjectId)
      if (!subject) {
        throw new NotFoundException(`Không tìm thấy môn học với ID ${subjectId}`)
      }

      const chapterList = await repos.chapterRepository.findBySubjectId(subjectId)
      return ChapterResponseDto.fromChapterList(chapterList)
    })

    return BaseResponseDto.success('Lấy danh sách chương theo môn học thành công', chapters)
  }
}