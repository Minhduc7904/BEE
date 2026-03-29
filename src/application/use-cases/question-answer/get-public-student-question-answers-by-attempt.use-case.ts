import { Inject, Injectable } from '@nestjs/common'
import type {
  IExamAttemptRepository,
  IQuestionAnswerRepository,
  IStudentRepository,
} from '../../../domain/repositories'
import {
  StudentQuestionAnswerByAttemptResponseDto,
  StudentQuestionAnswerItemDto,
} from '../../dtos/question-answer/student-question-answer.dto'
import {
  ForbiddenException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetPublicStudentQuestionAnswersByAttemptUseCase {
  constructor(
    @Inject('IQuestionAnswerRepository')
    private readonly questionAnswerRepository: IQuestionAnswerRepository,
    @Inject('IExamAttemptRepository')
    private readonly examAttemptRepository: IExamAttemptRepository,
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(
    studentId: number,
    attemptId: number,
  ): Promise<StudentQuestionAnswerByAttemptResponseDto> {
    const student = await this.studentRepository.findById(studentId)

    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const attempt = await this.examAttemptRepository.findPublicByAttemptAndStudent(attemptId, studentId)

    if (!attempt) {
      throw new NotFoundException(`Không tìm thấy lượt làm bài với ID ${attemptId}`)
    }

    const answers = await this.questionAnswerRepository.findPublicByStudentAndAttempt(studentId, attemptId)

    const questionAnswers = answers.map((item) =>
      StudentQuestionAnswerItemDto.fromEntityByAttemptStatus(item, attempt.status),
    )

    return StudentQuestionAnswerByAttemptResponseDto.fromResult(
      attemptId,
      attempt.status,
      questionAnswers,
    )
  }
}
