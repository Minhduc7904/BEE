// src/application/use-cases/temp-exam/get-temp-exam-by-session.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ITempExamRepository } from '../../../domain/repositories/temp-exam.repository'
import { TempExamResponseDto } from '../../dtos/temp-exam'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetTempExamBySessionUseCase {
  constructor(
    @Inject('ITempExamRepository')
    private readonly tempExamRepository: ITempExamRepository,
  ) {}

  async execute(sessionId: number): Promise<BaseResponseDto<TempExamResponseDto | null>> {
    const tempExam = await this.tempExamRepository.findBySessionId(sessionId)

    if (!tempExam) {
      return BaseResponseDto.success('Không tìm thấy TempExam cho session này', null)
    }

    return BaseResponseDto.success('Lấy thông tin TempExam thành công', TempExamResponseDto.fromEntity(tempExam))
  }
}
