import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionAnswerRepository, IStudentRepository } from '../../../domain/repositories'
import { StudentQuestionAnswerListQueryDto } from '../../dtos/question-answer/student-question-answer-list-query.dto'
import {
  StudentQuestionAnswerItemDto,
  StudentQuestionAnswerListResponseDto,
} from '../../dtos/question-answer/student-question-answer.dto'
import {
  ForbiddenException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetPublicStudentQuestionAnswersUseCase {
  constructor(
    @Inject('IQuestionAnswerRepository')
    private readonly questionAnswerRepository: IQuestionAnswerRepository,
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(
    studentId: number,
    query: StudentQuestionAnswerListQueryDto,
  ): Promise<StudentQuestionAnswerListResponseDto> {
    const student = await this.studentRepository.findById(studentId)

    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const pagination = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }

    const result = await this.questionAnswerRepository.findPublicByStudentWithPagination(
      studentId,
      pagination,
      {
        examId: query.examId,
        attemptId: query.attemptId,
        questionId: query.questionId,
      },
    )

    const questionAnswers = result.questionAnswers.map((item) =>
      StudentQuestionAnswerItemDto.fromEntity(item),
    )

    return StudentQuestionAnswerListResponseDto.fromResult(
      questionAnswers,
      result.page,
      result.limit,
      result.total,
    )
  }
}
