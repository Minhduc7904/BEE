import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { HomeworkContentType } from 'src/shared/enums'
import {
  ConflictException,
  InvalidStateException,
  NotFoundException,
} from 'src/shared/exceptions/custom-exceptions'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class UngradeStudentFileHomeworkUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    homeworkSubmitId: number,
    adminId: number,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existingSubmit = await repos.homeworkSubmitRepository.findById(homeworkSubmitId)
      if (!existingSubmit || !existingSubmit.homeworkContent) {
        throw new NotFoundException('Không tìm thấy bài nộp bài tập')
      }

      if (existingSubmit.homeworkContent.type !== HomeworkContentType.FILE_UPLOAD) {
        throw new ConflictException('API này chỉ gỡ chấm điểm cho bài tập FILE_UPLOAD')
      }

      if (
        (existingSubmit.points === null || existingSubmit.points === undefined) &&
        !existingSubmit.gradedAt &&
        !existingSubmit.graderId &&
        !existingSubmit.feedback
      ) {
        throw new InvalidStateException('Bài nộp chưa được chấm điểm')
      }

      const homeworkSubmit = await repos.homeworkSubmitRepository.update(homeworkSubmitId, {
        points: null,
        gradedAt: null,
        graderId: null,
        feedback: null,
      })

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
        resourceId: homeworkSubmitId.toString(),
        beforeData: {
          points: existingSubmit.points,
          gradedAt: existingSubmit.gradedAt,
          graderId: existingSubmit.graderId,
          feedback: existingSubmit.feedback,
        },
        afterData: {
          points: null,
          gradedAt: null,
          graderId: null,
          feedback: null,
        },
      })

      return HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)
    })

    return BaseResponseDto.success('Gỡ chấm điểm bài tập thành công', result)
  }
}
