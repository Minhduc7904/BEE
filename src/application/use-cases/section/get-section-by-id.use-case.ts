// src/application/use-cases/section/get-section-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ISectionRepository } from '../../../domain/repositories/section.repository'
import { SectionResponseDto } from '../../dtos/section/section.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetSectionByIdUseCase {
  constructor(
    @Inject('ISectionRepository')
    private readonly sectionRepository: ISectionRepository,
  ) {}

  async execute(sectionId: number): Promise<BaseResponseDto<SectionResponseDto>> {
    const section = await this.sectionRepository.findById(sectionId)

    if (!section) {
      throw new NotFoundException('Không tìm thấy phần')
    }

    return {
      success: true,
      message: 'Lấy thông tin phần thành công',
      data: SectionResponseDto.fromEntity(section),
    }
  }
}
