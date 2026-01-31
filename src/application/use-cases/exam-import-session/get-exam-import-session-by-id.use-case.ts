// src/application/use-cases/exam-import-session/get-exam-import-session-by-id.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import { ExamImportSessionResponseDto } from '../../dtos/exam-import-session/exam-import-session.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetExamImportSessionByIdUseCase {
  constructor(
    @Inject('IExamImportSessionRepository')
    private readonly sessionRepository: IExamImportSessionRepository,
  ) {}

  async execute(sessionId: number): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    const session = await this.sessionRepository.findByIdWithRelations(sessionId)

    if (!session) {
      throw new NotFoundException(`Không tìm thấy phiên import với ID ${sessionId}`)
    }

    return BaseResponseDto.success(
      'Lấy thông tin phiên import thành công',
      ExamImportSessionResponseDto.fromEntity(session),
    )
  }
}
