// src/application/use-cases/temp-exam/create-temp-exam.use-case.ts
import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common'
import type { ITempExamRepository } from '../../../domain/repositories/temp-exam.repository'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import { CreateTempExamDto, TempExamResponseDto } from '../../dtos/temp-exam'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class CreateTempExamUseCase {
  constructor(
    @Inject('ITempExamRepository')
    private readonly tempExamRepository: ITempExamRepository,
    @Inject('IExamImportSessionRepository')
    private readonly sessionRepository: IExamImportSessionRepository,
  ) {}

  async execute(sessionId: number, dto: CreateTempExamDto): Promise<BaseResponseDto<TempExamResponseDto>> {
    // Kiểm tra session tồn tại
    const session = await this.sessionRepository.findById(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} không tồn tại`)
    }

    // Kiểm tra session đã có TempExam chưa
    const existingTempExam = await this.tempExamRepository.findBySessionId(sessionId)
    if (existingTempExam) {
      throw new ConflictException(`Session ${sessionId} đã có TempExam`)
    }

    // Tạo TempExam
    const tempExam = await this.tempExamRepository.create({
      sessionId,
      title: dto.title,
      description: dto.description,
      grade: dto.grade,
      subjectId: dto.subjectId,
      visibility: dto.visibility,
      metadata: dto.metadata,
      rawContent: dto.rawContent,
      solutionYoutubeUrl: dto.solutionYoutubeUrl,
    })

    return BaseResponseDto.success('Tạo TempExam thành công', TempExamResponseDto.fromEntity(tempExam))
  }
}
