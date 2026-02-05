// src/application/use-cases/section/get-sections-by-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ISectionRepository } from '../../../domain/repositories/section.repository'
import { SectionResponseDto } from '../../dtos/section/section.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetSectionsByExamUseCase {
  constructor(
    @Inject('ISectionRepository')
    private readonly sectionRepository: ISectionRepository,
  ) {}

  async execute(examId: number): Promise<BaseResponseDto<SectionResponseDto[]>> {
    const sections = await this.sectionRepository.findByExamId(examId)
    const sectionDtos = SectionResponseDto.fromEntities(sections)

    return {
      success: true,
      message: 'Lấy danh sách phần thành công',
      data: sectionDtos,
    }
  }
}
