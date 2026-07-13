import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { HomeworkContentType } from 'src/shared/enums'
import { ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
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

      if (existingSubmit.homeworkContent.type !== HomeworkContentType.FILE_UPLOAD) {
        throw new ConflictException('API này chỉ chấm bài tập có type FILE_UPLOAD')
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

    return BaseResponseDto.success('Chấm bài tập thành công', result)
  }
}
