import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, SubjectResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetSubjectUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(id: number): Promise<BaseResponseDto<SubjectResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const subjectRepository = repos.subjectRepository

      const subject = await subjectRepository.findById(id)

      if (!subject) {
        throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`)
      }

      return SubjectResponseDto.fromSubject(subject)
    })

    return BaseResponseDto.success('Lấy thông tin môn học thành công', result)
  }
}
