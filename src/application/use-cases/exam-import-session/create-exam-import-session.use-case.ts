// src/application/use-cases/exam-import-session/create-exam-import-session.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import {
  ExamImportSessionResponseDto,
} from '../../dtos/exam-import-session/exam-import-session.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class CreateExamImportSessionUseCase {
  constructor(
    @Inject('IExamImportSessionRepository')
    private readonly sessionRepository: IExamImportSessionRepository,
  ) {}

  async execute(
    createdBy: number,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    const session = await this.sessionRepository.create({
      createdBy,
    })

    return BaseResponseDto.success(
      'Tạo phiên import thành công',
      ExamImportSessionResponseDto.fromEntity(session),
    )
  }
}
