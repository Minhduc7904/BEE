// src/application/use-cases/exam/create-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { CreateExamDto } from '../../dtos/exam/create-exam.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ExamResponseDto } from '../../dtos/exam/exam.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { ExamVisibility } from 'src/shared/enums'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { EXAM_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class CreateExamUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(dto: CreateExamDto, adminId?: number): Promise<BaseResponseDto<ExamResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const examRepository = repos.examRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Normalize and extract media from content fields
      const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
        { fieldName: EXAM_MEDIA_FIELDS.DESCRIPTION, content: dto.description },
      ])

      const createData = {
        title: dto.title,
        grade: dto.grade,
        visibility: dto.visibility || ExamVisibility.DRAFT,
        adminId: adminId!,
        description: this.attachMediaFromContentUseCase.getNormalizedContent(normalizedResults, EXAM_MEDIA_FIELDS.DESCRIPTION),
        subjectId: dto.subjectId,
        solutionYoutubeUrl: dto.solutionYoutubeUrl,
        typeOfExam: dto.typeOfExam,
      }

      const exam = await examRepository.create(createData)

      // Attach media to exam
      await this.attachMediaFromContentUseCase.attachMedia(
        normalizedResults,
        EntityType.EXAM,
        exam.examId,
        adminId!,
        mediaUsageRepository,
      )

      // TODO: Link questions if provided (need QuestionExam repository)
      // if (dto.questionIds && dto.questionIds.length > 0) {
      //   const questionExamData = dto.questionIds.map((questionId, index) => ({
      //     examId: exam.examId,
      //     questionId,
      //     order: index + 1,
      //     points: 10, // Default points
      //   }))
      //   await questionExamRepository.createMany(questionExamData)
      // }

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.EXAM.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.EXAM,
          resourceId: exam.examId.toString(),
          afterData: {
            title: exam.title,
            visibility: exam.visibility,
            grade: exam.grade,
          },
        })
      }

      // Reload to get relations
      return await examRepository.findById(exam.examId)
    })

    return {
      success: true,
      message: 'Tạo đề thi thành công',
      data: ExamResponseDto.fromEntity(result!),
    }
  }
}
