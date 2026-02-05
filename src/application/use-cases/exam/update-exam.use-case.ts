// src/application/use-cases/exam/update-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { UpdateExamDto } from '../../dtos/exam/update-exam.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ExamResponseDto } from '../../dtos/exam/exam.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { EXAM_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class UpdateExamUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(examId: number, dto: UpdateExamDto, adminId?: number): Promise<BaseResponseDto<ExamResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const examRepository = repos.examRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const exam = await examRepository.findById(examId)

      if (!exam) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.EXAM.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.EXAM,
            resourceId: examId.toString(),
            errorMessage: 'Không tìm thấy đề thi',
          })
        }
        throw new NotFoundException('Không tìm thấy đề thi')
      }

      const updateData: any = {}
      if (dto.title !== undefined) updateData.title = dto.title
      if (dto.grade !== undefined) updateData.grade = dto.grade
      if (dto.visibility !== undefined) updateData.visibility = dto.visibility
      if (dto.subjectId !== undefined) updateData.subjectId = dto.subjectId
      if (dto.solutionYoutubeUrl !== undefined) updateData.solutionYoutubeUrl = dto.solutionYoutubeUrl

      // Handle description with media normalization
      if (dto.description !== undefined) {
        const oldDescription = exam.description

        const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
          { fieldName: EXAM_MEDIA_FIELDS.DESCRIPTION, content: dto.description },
        ])

        const normalizedDescription = this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedResults,
          EXAM_MEDIA_FIELDS.DESCRIPTION,
        )

        updateData.description = normalizedDescription

        // Sync media changes for description
        await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
          oldDescription,
          normalizedDescription,
          EntityType.EXAM,
          examId,
          adminId!,
          mediaUsageRepository,
          EXAM_MEDIA_FIELDS.DESCRIPTION,
        )
      }

      const updatedExam = await examRepository.update(examId, updateData)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.EXAM.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.EXAM,
          resourceId: examId.toString(),
          beforeData: {
            title: exam.title,
            visibility: exam.visibility,
            grade: exam.grade,
          },
          afterData: {
            title: updatedExam.title,
            visibility: updatedExam.visibility,
            grade: updatedExam.grade,
          },
        })
      }

      // Reload to get relations
      return await examRepository.findById(examId)
    })

    return {
      success: true,
      message: 'Cập nhật đề thi thành công',
      data: ExamResponseDto.fromEntity(result!),
    }
  }
}
