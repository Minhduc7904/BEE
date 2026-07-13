import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import {
  ResubmitStudentFileHomeworkDto,
  SubmitStudentFileHomeworkDto,
} from '../../dtos/homeworkSubmit/student-file-homework-submit.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { HOMEWORK_SUBMIT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import { MediaStatus, MediaVisibility } from 'src/shared/enums'
import {
  ConflictException,
  ForbiddenException,
  InvalidStateException,
  NotFoundException,
} from 'src/shared/exceptions/custom-exceptions'
import { StudentFileHomeworkAccessService } from './student-file-homework-access.service'

type SubmissionPayload = {
  homeworkContentId: number
  content: string
  mediaIds: number[]
}

@Injectable()
export class SubmitStudentFileHomeworkUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly studentFileHomeworkAccessService: StudentFileHomeworkAccessService,
  ) {}

  async execute(
    dto: SubmitStudentFileHomeworkDto,
    studentId: number,
    userId: number,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    return this.submit(dto, studentId, userId, false)
  }

  async resubmit(
    homeworkContentId: number,
    dto: ResubmitStudentFileHomeworkDto,
    studentId: number,
    userId: number,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    return this.submit({ ...dto, homeworkContentId }, studentId, userId, true)
  }

  private async submit(
    dto: SubmissionPayload,
    studentId: number,
    userId: number,
    isResubmit: boolean,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    const homeworkContent =
      await this.studentFileHomeworkAccessService.getAccessibleHomework(
        dto.homeworkContentId,
        studentId,
      )
    this.studentFileHomeworkAccessService.assertCanSubmit(homeworkContent)

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existingSubmit = await repos.homeworkSubmitRepository.findByHomeworkAndStudent(
        dto.homeworkContentId,
        studentId,
      )

      if (!isResubmit && existingSubmit) {
        throw new ConflictException('Bạn đã nộp bài. Hãy dùng API nộp lại nếu bài chưa được chấm.')
      }

      if (isResubmit && !existingSubmit) {
        throw new NotFoundException('Chưa có bài nộp để nộp lại')
      }

      if (
        isResubmit &&
        (existingSubmit!.points !== null && existingSubmit!.points !== undefined ||
          existingSubmit!.gradedAt !== null && existingSubmit!.gradedAt !== undefined)
      ) {
        throw new InvalidStateException('Bài nộp đã được chấm nên không thể nộp lại')
      }

      await this.validateMediaOwnership(repos, dto.mediaIds, userId)

      const homeworkSubmit = isResubmit
        ? await repos.homeworkSubmitRepository.update(existingSubmit!.homeworkSubmitId, {
            content: dto.content,
            submitAt: new Date(),
          })
        : await repos.homeworkSubmitRepository.create({
            homeworkContentId: dto.homeworkContentId,
            studentId,
            content: dto.content,
          })

      if (isResubmit) {
        await repos.mediaUsageRepository.detachByEntity(
          EntityType.HOMEWORK_SUBMIT,
          homeworkSubmit.homeworkSubmitId,
          HOMEWORK_SUBMIT_MEDIA_FIELDS.ATTACHMENTS,
        )
      }

      const attachments = await Promise.all(
        dto.mediaIds.map((mediaId) =>
          repos.mediaUsageRepository.attach({
            mediaId,
            entityType: EntityType.HOMEWORK_SUBMIT,
            entityId: homeworkSubmit.homeworkSubmitId,
            fieldName: HOMEWORK_SUBMIT_MEDIA_FIELDS.ATTACHMENTS,
            usedBy: userId,
            visibility: MediaVisibility.PRIVATE,
          }),
        ),
      )

      return HomeworkSubmitResponseDto.fromEntity(homeworkSubmit, attachments)
    })

    return BaseResponseDto.success(
      isResubmit ? 'Nộp lại bài tập thành công' : 'Nộp bài tập thành công',
      result,
    )
  }

  private async validateMediaOwnership(
    repos: UnitOfWorkRepos,
    mediaIds: number[],
    userId: number,
  ): Promise<void> {
    if (new Set(mediaIds).size !== mediaIds.length) {
      throw new ConflictException('Danh sách media không được chứa ID trùng lặp')
    }

    const mediaFiles = await repos.mediaRepository.findByIds(mediaIds)
    if (mediaFiles.length !== mediaIds.length) {
      throw new NotFoundException('Có file đính kèm không tồn tại')
    }

    for (const media of mediaFiles) {
      if (media.uploadedBy !== userId) {
        throw new ForbiddenException('Bạn chỉ có thể đính kèm file do chính mình tải lên')
      }

      if (media.status !== MediaStatus.READY) {
        throw new ConflictException('File đính kèm chưa sẵn sàng để nộp')
      }
    }
  }
}
