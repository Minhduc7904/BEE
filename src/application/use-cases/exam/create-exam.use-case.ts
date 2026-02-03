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

@Injectable()
export class CreateExamUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateExamDto, adminId?: number): Promise<BaseResponseDto<ExamResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const examRepository = repos.examRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const createData = {
        title: dto.title,
        grade: dto.grade,
        visibility: dto.visibility || ExamVisibility.DRAFT,
        adminId: adminId!,
        description: dto.description,
        subjectId: dto.subjectId,
        solutionYoutubeUrl: dto.solutionYoutubeUrl,
      }

      const exam = await examRepository.create(createData)

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
