// src/application/use-cases/temp-exam/update-temp-exam.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ITempExamRepository } from '../../../domain/repositories/temp-exam.repository'
import { UpdateTempExamDto, TempExamResponseDto } from '../../dtos/temp-exam'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class UpdateTempExamUseCase {
  constructor(
    @Inject('ITempExamRepository')
    private readonly tempExamRepository: ITempExamRepository,
  ) {}

  async execute(
    tempExamId: string,
    dto: UpdateTempExamDto,
  ): Promise<BaseResponseDto<TempExamResponseDto>> {
    // Kiểm tra TempExam tồn tại
    const existingTempExam = await this.tempExamRepository.findById(tempExamId)
    if (!existingTempExam) {
      throw new NotFoundException(`TempExam ${tempExamId} không tồn tại`)
    }

    // Cập nhật TempExam
    const updatedTempExam = await this.tempExamRepository.update(tempExamId, {
      title: dto.title,
      description: dto.description,
      grade: dto.grade,
      subjectId: dto.subjectId,
      visibility: dto.visibility,
      metadata: dto.metadata,
      rawContent: dto.rawContent,
    })

    return BaseResponseDto.success(
      'Cập nhật TempExam thành công',
      TempExamResponseDto.fromEntity(updatedTempExam),
    )
  }
}
