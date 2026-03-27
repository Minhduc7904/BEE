import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'
import {
  type ICompetitionSubmitRepository,
  type IExamAttemptRepository,
  type IStudentRepository,
} from '../../../domain/repositories'
import {
  StudentDailyActivityItemDto,
  StudentYearlyActivityResponseDto,
} from '../../dtos/profile/student-yearly-activity-response.dto'
import { formatVnDateISO } from '../../../shared/utils/vietnam-date.util'

type StudentIdentityInput = {
  userId?: number
  studentId?: number
}

@Injectable()
export class GetStudentYearlyActivityUseCase {
  constructor(
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    @Inject('IExamAttemptRepository')
    private readonly examAttemptRepository: IExamAttemptRepository,
  ) { }

  async execute(
    identity: StudentIdentityInput,
    yearInput?: string,
  ): Promise<BaseResponseDto<StudentYearlyActivityResponseDto>> {
    const year = this.parseYear(yearInput)
    const student = await this.resolveStudent(identity)

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const [competitionRows, examAttemptRows] = await Promise.all([
      this.competitionSubmitRepository.countByStudentDailyInYear(student.studentId, year),
      this.examAttemptRepository.countByStudentDailyInYear(student.studentId, year),
    ])

    const competitionMap = new Map(competitionRows.map((row) => [row.date, row.count]))
    const examAttemptMap = new Map(examAttemptRows.map((row) => [row.date, row.count]))

    const from = new Date(Date.UTC(year, 0, 1))
    const to = new Date(Date.UTC(year + 1, 0, 1))
    const items: StudentDailyActivityItemDto[] = []

    for (const cursor = new Date(from); cursor < to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10)
      items.push(
        new StudentDailyActivityItemDto({
          date,
          competitionSubmitCount: competitionMap.get(date) || 0,
          examAttemptCount: examAttemptMap.get(date) || 0,
        }),
      )
    }

    return BaseResponseDto.success(
      `Lấy thống kê hoạt động theo ngày năm ${year} thành công`,
      new StudentYearlyActivityResponseDto({ year, days: items }),
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

    throw new ValidationException('Thiếu userId hoặc studentId để lấy thống kê hoạt động')
  }

  private parseYear(yearInput?: string): number {
    if (!yearInput || yearInput.trim().length === 0) {
      return Number(formatVnDateISO(new Date()).slice(0, 4))
    }

    const year = Number(yearInput)
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new ValidationException('Năm không hợp lệ. Vui lòng truyền year trong khoảng 2000-2100')
    }

    return year
  }
}
