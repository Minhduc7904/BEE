// src/application/use-cases/exam/update-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { UpdateExamDto } from '../../dtos/exam/update-exam.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ExamResponseDto } from '../../dtos/exam/exam.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class UpdateExamUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(examId: number, dto: UpdateExamDto, adminId?: number): Promise<BaseResponseDto<ExamResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const examRepository = repos.examRepository
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
      if (dto.description !== undefined) updateData.description = dto.description
      if (dto.subjectId !== undefined) updateData.subjectId = dto.subjectId
      if (dto.solutionYoutubeUrl !== undefined) updateData.solutionYoutubeUrl = dto.solutionYoutubeUrl

      const updatedExam = await examRepository.update(examId, updateData)

      // TODO: Update question links if provided
      // if (dto.questionIds !== undefined) {
      //   // Delete existing links
      //   await questionExamRepository.deleteByExamId(examId)
      //   // Create new links
      //   if (dto.questionIds.length > 0) {
      //     const questionExamData = dto.questionIds.map((questionId, index) => ({
      //       examId: examId,
      //       questionId,
      //       order: index + 1,
      //       points: 10,
      //     }))
      //     await questionExamRepository.createMany(questionExamData)
      //   }
      // }

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
