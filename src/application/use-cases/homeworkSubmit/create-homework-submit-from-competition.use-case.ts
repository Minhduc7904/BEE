import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { ConflictException, NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionSubmitResponseDto } from '../../dtos/competition-submit/competition-submit.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import {
  CompetitionSubmitSelection,
  CreateHomeworkSubmitFromCompetitionDto,
} from '../../dtos/homeworkSubmit/create-homework-submit-from-competition.dto'
import { HandleHomeworkSubmitByCompetitionUseCase } from '../competition-submit/handle-homework-submit-by-competition.use-case'

@Injectable()
export class CreateHomeworkSubmitFromCompetitionUseCase {
  constructor(
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    @Inject('IHomeworkSubmitRepository')
    private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    private readonly handleHomeworkSubmitByCompetitionUseCase: HandleHomeworkSubmitByCompetitionUseCase,
  ) {}

  async execute(dto: CreateHomeworkSubmitFromCompetitionDto): Promise<BaseResponseDto<any>> {
    const competitionSubmit = await this.selectCompetitionSubmit(dto)
    const autoFeedback = dto.autoFeedback !== false
    const linkedHomeworkSubmit = await this.homeworkSubmitRepository.findByCompetitionSubmitId(
      competitionSubmit.competitionSubmitId,
    )
    const existingHomeworkSubmit = await this.homeworkSubmitRepository.findByHomeworkAndStudent(
      dto.homeworkContentId,
      dto.studentId,
    )

    if (
      linkedHomeworkSubmit &&
      linkedHomeworkSubmit.homeworkSubmitId !== existingHomeworkSubmit?.homeworkSubmitId
    ) {
      throw new ConflictException(
        `Lượt thi ${competitionSubmit.competitionSubmitId} đã được gắn với homework submit ${linkedHomeworkSubmit.homeworkSubmitId}`,
      )
    }

    const points = Number(competitionSubmit.totalPoints ?? 0)
    const content = `Nộp bài qua cuộc thi #${competitionSubmit.competitionId} (submit #${competitionSubmit.competitionSubmitId})`
    const action = existingHomeworkSubmit ? 'updated' : 'created'
    let homeworkSubmitId: number

    if (autoFeedback) {
      if (existingHomeworkSubmit) {
        const result = await this.handleHomeworkSubmitByCompetitionUseCase.excuteUpdate({
          homeworkSubmitId: existingHomeworkSubmit.homeworkSubmitId,
          submitId: competitionSubmit.competitionSubmitId,
          competitionSubmitId: competitionSubmit.competitionSubmitId,
          points,
        })
        homeworkSubmitId = result.homeworkSubmitId
      } else {
        const result = await this.handleHomeworkSubmitByCompetitionUseCase.excuteCreate({
          homeworkContentId: dto.homeworkContentId,
          studentId: dto.studentId,
          competitionId: competitionSubmit.competitionId,
          submitId: competitionSubmit.competitionSubmitId,
          competitionSubmitId: competitionSubmit.competitionSubmitId,
          points,
        })
        homeworkSubmitId = result.homeworkSubmitId
      }
    } else {
      if (!dto.manualFeedback?.trim()) {
        throw new ValidationException('manualFeedback là bắt buộc khi autoFeedback là false')
      }

      const feedback = dto.manualFeedback.trim()

      if (existingHomeworkSubmit) {
        const updated = await this.homeworkSubmitRepository.update(existingHomeworkSubmit.homeworkSubmitId, {
          content,
          points,
          competitionSubmitId: competitionSubmit.competitionSubmitId,
          feedback,
        })
        homeworkSubmitId = updated.homeworkSubmitId
      } else {
        const created = await this.homeworkSubmitRepository.create({
          homeworkContentId: dto.homeworkContentId,
          studentId: dto.studentId,
          content,
          competitionSubmitId: competitionSubmit.competitionSubmitId,
        })
        const updated = await this.homeworkSubmitRepository.update(created.homeworkSubmitId, {
          points,
          feedback,
        })
        homeworkSubmitId = updated.homeworkSubmitId
      }
    }

    const homeworkSubmit = await this.homeworkSubmitRepository.findById(homeworkSubmitId)
    if (!homeworkSubmit) {
      throw new NotFoundException(`Homework submit ${homeworkSubmitId} không tồn tại sau khi tạo`)
    }

    return BaseResponseDto.success('Đã tạo homework submit từ lượt thi đã nộp', {
      action,
      autoFeedback,
      homeworkSubmit: HomeworkSubmitResponseDto.fromEntity(homeworkSubmit),
      competitionSubmit: CompetitionSubmitResponseDto.fromEntity(competitionSubmit),
    })
  }

  private async selectCompetitionSubmit(dto: CreateHomeworkSubmitFromCompetitionDto) {
    const selection = dto.selection ?? CompetitionSubmitSelection.LATEST
    const submittedAttempts = (await this.competitionSubmitRepository.findByStudent(dto.studentId)).filter(
      (attempt) => attempt.status === CompetitionSubmitStatus.SUBMITTED,
    )

    if (submittedAttempts.length === 0) {
      throw new NotFoundException(`Học sinh ${dto.studentId} chưa có lượt thi nào ở trạng thái SUBMITTED`)
    }

    if (selection === CompetitionSubmitSelection.SPECIFIC) {
      if (!dto.competitionSubmitId) {
        throw new ValidationException('competitionSubmitId là bắt buộc khi selection là SPECIFIC')
      }

      const selected = submittedAttempts.find(
        (attempt) => attempt.competitionSubmitId === dto.competitionSubmitId,
      )
      if (!selected) {
        throw new NotFoundException(
          `Không tìm thấy lượt thi SUBMITTED ${dto.competitionSubmitId} của học sinh ${dto.studentId}`,
        )
      }
      return selected
    }

    const bySubmittedAt = (left: any, right: any) =>
      new Date(left.submittedAt ?? left.createdAt).getTime() -
      new Date(right.submittedAt ?? right.createdAt).getTime()

    if (selection === CompetitionSubmitSelection.OLDEST) {
      return [...submittedAttempts].sort(bySubmittedAt)[0]
    }

    if (selection === CompetitionSubmitSelection.HIGHEST_SCORE) {
      return [...submittedAttempts].sort((left, right) => {
        const pointDifference = Number(right.totalPoints ?? 0) - Number(left.totalPoints ?? 0)
        return pointDifference !== 0 ? pointDifference : -bySubmittedAt(left, right)
      })[0]
    }

    return [...submittedAttempts].sort(bySubmittedAt).at(-1)!
  }
}
