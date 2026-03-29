import { Inject, Injectable } from '@nestjs/common'
import type { IExamAttemptRepository, IStudentRepository } from '../../../domain/repositories'
import {
  ForbiddenException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { StudentExamAttemptDetailResponseDto } from '../../dtos/exam-attempt'

@Injectable()
export class GetPublicStudentExamAttemptDetailUseCase {
  constructor(
    @Inject('IExamAttemptRepository')
    private readonly examAttemptRepository: IExamAttemptRepository,
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(
    attemptId: number,
    studentId: number,
  ): Promise<StudentExamAttemptDetailResponseDto> {
    const student = await this.studentRepository.findById(studentId)

    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const examAttempt = await this.examAttemptRepository.findPublicByAttemptAndStudent(
      attemptId,
      studentId,
    )

    if (!examAttempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài')
    }

    return StudentExamAttemptDetailResponseDto.fromEntity(examAttempt)
  }
}
