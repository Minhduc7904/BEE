import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import {
  StudentDifficultyProgressItemDto,
  StudentDifficultyProgressResponseDto,
} from '../../dtos/profile/student-difficulty-progress-response.dto'
import {
  type IQuestionAnswerRepository,
  type IStudentRepository,
} from '../../../domain/repositories'
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'

type StudentIdentityInput = {
  userId?: number
  studentId?: number
}

@Injectable()
export class GetStudentDifficultyProgressUseCase {
  constructor(
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
    @Inject('IQuestionAnswerRepository')
    private readonly questionAnswerRepository: IQuestionAnswerRepository,
  ) { }

  async execute(
    identity: StudentIdentityInput,
  ): Promise<BaseResponseDto<StudentDifficultyProgressResponseDto>> {
    const student = await this.resolveStudent(identity)

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const stats = await this.questionAnswerRepository.getStudentDifficultyProgress(
      student.studentId,
      student.grade,
    )

    const items = stats.map(
      (item) =>
        new StudentDifficultyProgressItemDto({
          difficulty: item.difficulty,
          done: item.doneCount,
          total: item.totalCount,
        }),
    )

    return BaseResponseDto.success(
      'Lấy thống kê tiến độ theo độ khó thành công',
      new StudentDifficultyProgressResponseDto(items),
    )
  }

  private async resolveStudent(identity: StudentIdentityInput) {
    if (identity.studentId) {
      const byStudentId = await this.studentRepository.findById(identity.studentId)

      if (!byStudentId) {
        throw new NotFoundException('Student profile not found')
      }

      return byStudentId
    }

    if (identity.userId) {
      const byUserId = await this.studentRepository.findByUserId(identity.userId)

      if (!byUserId) {
        throw new NotFoundException('Student profile not found')
      }

      return byUserId
    }

    throw new ValidationException('Thiếu userId hoặc studentId để lấy tiến độ học sinh')
  }
}
