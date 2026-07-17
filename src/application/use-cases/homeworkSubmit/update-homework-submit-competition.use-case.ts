import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { ConflictException, NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionSubmitResponseDto } from '../../dtos/competition-submit/competition-submit.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { CompetitionSubmitSelection } from '../../dtos/homeworkSubmit/create-homework-submit-from-competition.dto'
import { UpdateHomeworkSubmitCompetitionDto } from '../../dtos/homeworkSubmit/update-homework-submit-competition.dto'
import { HandleHomeworkSubmitByCompetitionUseCase } from '../competition-submit/handle-homework-submit-by-competition.use-case'

@Injectable()
export class UpdateHomeworkSubmitCompetitionUseCase {
  constructor(
    @Inject('IHomeworkSubmitRepository')
    private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    private readonly handleHomeworkSubmitByCompetitionUseCase: HandleHomeworkSubmitByCompetitionUseCase,
  ) {}

  async execute(
    homeworkSubmitId: number,
    dto: UpdateHomeworkSubmitCompetitionDto,
  ): Promise<BaseResponseDto<any>> {
    const homeworkSubmit = await this.homeworkSubmitRepository.findById(homeworkSubmitId)
    if (!homeworkSubmit) {
      throw new NotFoundException(`Homework submit ${homeworkSubmitId} không tồn tại`)
    }

    const competitionSubmit = await this.selectCompetitionSubmit(homeworkSubmit.studentId, dto)
    const linkedHomeworkSubmit = await this.homeworkSubmitRepository.findByCompetitionSubmitId(
      competitionSubmit.competitionSubmitId,
    )
    if (linkedHomeworkSubmit && linkedHomeworkSubmit.homeworkSubmitId !== homeworkSubmit.homeworkSubmitId) {
      throw new ConflictException(
        `Lượt thi ${competitionSubmit.competitionSubmitId} đã được gắn với homework submit ${linkedHomeworkSubmit.homeworkSubmitId}`,
      )
    }

    const autoFeedback = dto.autoFeedback !== false
    const points = Number(competitionSubmit.totalPoints ?? 0)
    const content = `Nộp bài qua cuộc thi #${competitionSubmit.competitionId} (submit #${competitionSubmit.competitionSubmitId})`

    if (autoFeedback) {
      await this.handleHomeworkSubmitByCompetitionUseCase.excuteUpdate({
        homeworkSubmitId,
        submitId: competitionSubmit.competitionSubmitId,
        competitionSubmitId: competitionSubmit.competitionSubmitId,
        points,
      })
      await this.homeworkSubmitRepository.update(homeworkSubmitId, { content })
    } else {
      if (!dto.manualFeedback?.trim()) {
        throw new ValidationException('manualFeedback là bắt buộc khi autoFeedback là false')
      }

      await this.homeworkSubmitRepository.update(homeworkSubmitId, {
        content,
        points,
        competitionSubmitId: competitionSubmit.competitionSubmitId,
        feedback: dto.manualFeedback.trim(),
      })
    }

    const updatedHomeworkSubmit = await this.homeworkSubmitRepository.findById(homeworkSubmitId)
    if (!updatedHomeworkSubmit) {
      throw new NotFoundException(`Không thể tải homework submit ${homeworkSubmitId} sau khi cập nhật`)
    }

    return BaseResponseDto.success('Đã cập nhật homework submit theo lượt thi đã chọn', {
      autoFeedback,
      homeworkSubmit: HomeworkSubmitResponseDto.fromEntity(updatedHomeworkSubmit),
      competitionSubmit: CompetitionSubmitResponseDto.fromEntity(competitionSubmit),
    })
  }

  private async selectCompetitionSubmit(studentId: number, dto: UpdateHomeworkSubmitCompetitionDto) {
    const selection = dto.selection ?? CompetitionSubmitSelection.LATEST
    const submittedAttempts = (await this.competitionSubmitRepository.findByStudent(studentId)).filter(
      (attempt) => attempt.status === CompetitionSubmitStatus.SUBMITTED,
    )

    if (submittedAttempts.length === 0) {
      throw new NotFoundException(`Học sinh ${studentId} chưa có lượt thi nào ở trạng thái SUBMITTED`)
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
          `Không tìm thấy lượt thi SUBMITTED ${dto.competitionSubmitId} của học sinh ${studentId}`,
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
