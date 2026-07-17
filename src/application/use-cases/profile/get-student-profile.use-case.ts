// src/application/use-cases/profile/get-student-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type {
  IStudentRepository,
  IMediaUsageRepository,
  ICompetitionSubmitRepository,
  IExamAttemptRepository,
} from '../../../domain/repositories'
import { StudentResponseDto, BaseResponseDto } from '../../dtos'
import {
  NotFoundException,
  ForbiddenException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from 'src/application/interfaces'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../shared/constants'
import { MediaStatus } from '../../../shared/enums'
import { formatVnDateISO } from '../../../shared/utils/vietnam-date.util'

type StudentIdentityInput = {
  userId?: number
  studentId?: number
}

@Injectable()
export class GetStudentProfileUseCase {
  constructor(
    @Inject('IStudentRepository') private readonly studentRepository: IStudentRepository,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    @Inject('ICompetitionSubmitRepository') private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    @Inject('IExamAttemptRepository') private readonly examAttemptRepository: IExamAttemptRepository,
    private readonly minioService: MinioService,
  ) { }

  async execute(identity: StudentIdentityInput): Promise<BaseResponseDto<StudentResponseDto>> {
    const student = await this.resolveStudent(identity)

    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    // Mapper sẽ tự động xử lý việc lọc roles active và chưa expire
    // cũng như map permissions cho từng role
    const studentResponse = StudentResponseDto.fromUserWithStudent(student.user, student)
    studentResponse.streak = await this.calculateStreak(student.studentId)
    studentResponse.avatarUrl = undefined // Đặt mặc định là undefined, sẽ cập nhật nếu tìm thấy avatar media
    // Tìm media usage có entity là USER và fieldName là avatar
    const avatarUsages = await this.mediaUsageRepository.findByEntity(
      EntityType.USER,
      student.userId,
      USER_MEDIA_FIELDS.AVATAR,
    )

    if (avatarUsages.length > 0) {
      const avatarUsage = avatarUsages[0]
      const media = avatarUsage.media

      if (media && media.status === MediaStatus.READY) {
        try {
          const avatarUrl = await this.minioService.getPresignedUrl(
            media.bucketName,
            media.objectKey,
            3600 * 24, // 1 hour expiry
          )
          studentResponse.avatarUrl = avatarUrl
        } catch (error) {
          // Silently ignore - avatar URL is optional
        }
      }
    }

    return BaseResponseDto.success(
      'Get student profile successfully',
      studentResponse,
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

    throw new ValidationException('Thiếu userId hoặc studentId để lấy hồ sơ học sinh')
  }

  private async calculateStreak(studentId: number): Promise<number> {
    const [competitionDates, examAttemptDates] = await Promise.all([
      this.competitionSubmitRepository.getStudentActivityDatesVn(studentId),
      this.examAttemptRepository.getStudentActivityDatesVn(studentId),
    ])

    // Gộp + loại trùng
    const activeDates = new Set([
      ...competitionDates,
      ...examAttemptDates,
    ])

    if (activeDates.size === 0) return 0

    let streak = 0

    // 👉 Nếu hôm nay không có activity → bắt đầu từ hôm qua
    let cursor = formatVnDateISO(new Date())

    if (!activeDates.has(cursor)) {
      cursor = this.getPreviousDateIso(cursor)
    }

    // 👉 Loop an toàn (max 365 ngày)
    for (let i = 0; i < 365; i++) {
      if (activeDates.has(cursor)) {
        streak++
        cursor = this.getPreviousDateIso(cursor)
      } else {
        break
      }
    }

    return streak
  }

  private getPreviousDateIso(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00.000Z`)
    date.setUTCDate(date.getUTCDate() - 1)
    return formatVnDateISO(date)
  }
}

