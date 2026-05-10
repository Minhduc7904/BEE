// src/application/use-cases/temp-exam/update-temp-exam.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ITempExamRepository } from '../../../domain/repositories/temp-exam.repository'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { UpdateTempExamDto, TempExamResponseDto } from '../../dtos/temp-exam'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { EXAM_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class UpdateTempExamUseCase {
  constructor(
    @Inject('ITempExamRepository')
    private readonly tempExamRepository: ITempExamRepository,
    @Inject('IExamImportSessionRepository')
    private readonly sessionRepository: IExamImportSessionRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(
    tempExamId: number,
    dto: UpdateTempExamDto,
  ): Promise<BaseResponseDto<TempExamResponseDto>> {
    // Kiểm tra TempExam tồn tại
    const existingTempExam = await this.tempExamRepository.findById(tempExamId)
    if (!existingTempExam) {
      throw new NotFoundException(`TempExam ${tempExamId} không tồn tại`)
    }

    const session = await this.sessionRepository.findById(existingTempExam.sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${existingTempExam.sessionId} không tồn tại`)
    }

    const updateData: any = {
      title: dto.title,
      grade: dto.grade,
      subjectId: dto.subjectId,
      typeOfExam: dto.typeOfExam,
      visibility: dto.visibility,
      metadata: dto.metadata,
      rawContent: dto.rawContent,
      solutionYoutubeUrl: dto.solutionYoutubeUrl,
    }

    if (dto.description !== undefined) {
      const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
        { fieldName: EXAM_MEDIA_FIELDS.DESCRIPTION, content: dto.description },
      ])

      const normalizedDescription = this.attachMediaFromContentUseCase.getNormalizedContent(
        normalizedResults,
        EXAM_MEDIA_FIELDS.DESCRIPTION,
      )

      updateData.description = normalizedDescription || undefined

      await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
        existingTempExam.description,
        normalizedDescription,
        EntityType.TEMP_EXAM,
        tempExamId,
        session.createdBy,
        this.mediaUsageRepository,
        EXAM_MEDIA_FIELDS.DESCRIPTION,
      )
    }

    // Cập nhật TempExam
    const updatedTempExam = await this.tempExamRepository.update(tempExamId, updateData)

    return BaseResponseDto.success(
      'Cập nhật TempExam thành công',
      TempExamResponseDto.fromEntity(updatedTempExam),
    )
  }
}
