// src/application/use-cases/temp-exam/create-temp-exam.use-case.ts
import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common'
import type { ITempExamRepository } from '../../../domain/repositories/temp-exam.repository'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { CreateTempExamDto, TempExamResponseDto } from '../../dtos/temp-exam'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { EXAM_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class CreateTempExamUseCase {
  constructor(
    @Inject('ITempExamRepository')
    private readonly tempExamRepository: ITempExamRepository,
    @Inject('IExamImportSessionRepository')
    private readonly sessionRepository: IExamImportSessionRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
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

    // Normalize and extract media from content fields
    const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
      { fieldName: EXAM_MEDIA_FIELDS.DESCRIPTION, content: dto.description },
    ])

    // Tạo TempExam
    const tempExam = await this.tempExamRepository.create({
      sessionId,
      title: dto.title,
      description: this.attachMediaFromContentUseCase.getNormalizedContent(
        normalizedResults,
        EXAM_MEDIA_FIELDS.DESCRIPTION,
      ) || undefined,
      grade: dto.grade,
      subjectId: dto.subjectId,
      typeOfExam: dto.typeOfExam,
      visibility: dto.visibility,
      metadata: dto.metadata,
      rawContent: dto.rawContent,
      solutionYoutubeUrl: dto.solutionYoutubeUrl,
    })

    await this.attachMediaFromContentUseCase.attachMedia(
      normalizedResults,
      EntityType.TEMP_EXAM,
      tempExam.tempExamId,
      session.createdBy,
      this.mediaUsageRepository,
    )

    return BaseResponseDto.success('Tạo TempExam thành công', TempExamResponseDto.fromEntity(tempExam))
  }
}
