import { Inject, Injectable } from '@nestjs/common'
import type {
  IExamAttemptRepository,
  IExamRepository,
  IStudentRepository,
} from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StartPublicStudentExamAttemptDto } from '../../dtos/exam-attempt'
import { StudentExamAttemptItemDto } from '../../dtos/exam-attempt/student-exam-attempt.dto'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { ExamVisibility } from '../../../shared/enums/exam-visibility.enum'
import {
  BusinessLogicException,
  ForbiddenException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class CreatePublicStudentExamAttemptUseCase {
  constructor(
    @Inject('IExamAttemptRepository')
    private readonly examAttemptRepository: IExamAttemptRepository,
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(
    studentId: number,
    payload: StartPublicStudentExamAttemptDto,
  ): Promise<BaseResponseDto<StudentExamAttemptItemDto>> {
    const { examId, questionIds, duration } = payload
    const student = await this.studentRepository.findById(studentId)

    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const exam = await this.examRepository.findById(examId)

    if (!exam) {
      throw new NotFoundException('Không tìm thấy đề thi')
    }

    if (exam.visibility !== ExamVisibility.PUBLISHED) {
      throw new ForbiddenException('Đề thi chưa được công khai')
    }

    const allQuestionIds = await this.examAttemptRepository.findQuestionIdsByExamId(examId)

    if (allQuestionIds.length === 0) {
      throw new BusinessLogicException('Đề thi chưa có câu hỏi để bắt đầu làm bài')
    }

    let selectedQuestionIds = allQuestionIds

    if (questionIds && questionIds.length > 0) {
      const uniqueQuestionIds = Array.from(new Set(questionIds))
      const allowedQuestionIds = new Set(allQuestionIds)
      const invalidQuestionIds = uniqueQuestionIds.filter((id) => !allowedQuestionIds.has(id))

      if (invalidQuestionIds.length > 0) {
        throw new BusinessLogicException('Có câu hỏi không thuộc đề thi đã chọn')
      }

      selectedQuestionIds = uniqueQuestionIds
    }

    // Status is always forced to IN_PROGRESS for student start flow.

    const createdAttempt = await this.examAttemptRepository.create({
      examId,
      studentId,
      status: ExamAttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      duration,
      questionIds: selectedQuestionIds,
    })

    return BaseResponseDto.success(
      'Tạo lượt làm bài thành công',
      StudentExamAttemptItemDto.fromEntity(createdAttempt),
    )
  }
}
