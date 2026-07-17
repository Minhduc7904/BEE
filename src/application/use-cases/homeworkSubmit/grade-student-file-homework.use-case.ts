import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { HomeworkContentType } from 'src/shared/enums'
import {
  ConflictException,
  NotFoundException,
  ValidationException,
} from 'src/shared/exceptions/custom-exceptions'
import { GradeStudentFileHomeworkDto } from '../../dtos/homeworkSubmit/grade-student-file-homework.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class GradeStudentFileHomeworkUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    homeworkSubmitId: number,
    dto: GradeStudentFileHomeworkDto,
    adminId: number,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existingSubmit = await repos.homeworkSubmitRepository.findById(homeworkSubmitId)
      if (!existingSubmit || !existingSubmit.homeworkContent) {
        throw new NotFoundException('Không tìm thấy bài nộp bài tập')
      }

      const isFileHomework = existingSubmit.homeworkContent.type === HomeworkContentType.FILE_UPLOAD
      const isCompetitionHomework = existingSubmit.homeworkContent.type === HomeworkContentType.COMPETITION

      if (!isFileHomework && !isCompetitionHomework) {
        throw new ConflictException('Loại bài tập không được hỗ trợ chấm qua API này')
      }

      if (isCompetitionHomework) {
        if (dto.points !== undefined && dto.points !== null) {
          throw new ValidationException('Bài tập COMPETITION chỉ nhận feedback, không được truyền points')
        }

        if (!dto.feedback?.trim()) {
          throw new ValidationException('feedback là bắt buộc khi cập nhật bài tập COMPETITION')
        }

        const homeworkSubmit = await repos.homeworkSubmitRepository.update(homeworkSubmitId, {
          feedback: dto.feedback.trim(),
        })

        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
          resourceId: homeworkSubmit.homeworkSubmitId.toString(),
          beforeData: {
            feedback: existingSubmit.feedback,
          },
          afterData: {
            feedback: homeworkSubmit.feedback,
          },
        })

        return HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)
      }

      if (dto.points === undefined || dto.points === null) {
        throw new ValidationException('points là bắt buộc khi chấm bài tập FILE_UPLOAD')
      }

      const homeworkSubmit = await repos.homeworkSubmitRepository.grade(homeworkSubmitId, {
        points: dto.points,
        graderId: adminId,
        feedback: dto.feedback,
      })

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.GRADE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
        resourceId: homeworkSubmit.homeworkSubmitId.toString(),
        beforeData: {
          points: existingSubmit.points,
          feedback: existingSubmit.feedback,
          graderId: existingSubmit.graderId,
        },
        afterData: {
          points: homeworkSubmit.points,
          feedback: homeworkSubmit.feedback,
          graderId: homeworkSubmit.graderId,
          gradedAt: homeworkSubmit.gradedAt,
        },
      })

      return HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)
    })

    return BaseResponseDto.success('Cập nhật chấm bài tập thành công', result)
  }
}
