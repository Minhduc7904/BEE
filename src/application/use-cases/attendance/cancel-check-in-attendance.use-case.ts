import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceCheckInResponseDto } from 'src/application/dtos/attendance/check-in-attendance-response.dto'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { ConflictException, ForbiddenException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import {
  AttendanceStatus,
  AttendanceStatusLabels,
  AttendanceType,
  AttendanceTypeLabels,
  NotificationLevel,
  NotificationType,
} from 'src/shared/enums'
import { StudentPointService } from 'src/application/services/student-point.service'
import { AttendanceMakeupLinkService } from 'src/application/services/attendance-makeup-link.service'
import { AttendanceNotificationService } from 'src/application/services/attendance-notification.service'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'

/**
 * Hủy điểm danh: chuyển bản ghi Có mặt về Vắng.
 *
 * - Chỉ áp dụng khi bản ghi đang Có mặt (khác thì `ConflictException`).
 * - Bản ghi vừa hủy (giờ là Vắng) bị ép về loại Chính khóa.
 * - Gỡ các buổi vắng đang được bản ghi này bù và thử nối chúng sang bản ghi Học bù khác.
 * - Bản ghi vừa hủy được nối vào buổi đã học bù nếu có.
 */
@Injectable()
export class CancelCheckInAttendanceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
    private readonly studentPointService: StudentPointService,
    private readonly attendanceMakeupLinkService: AttendanceMakeupLinkService,
    private readonly attendanceNotificationService: AttendanceNotificationService,
  ) {}

  async execute(
    attendanceId: number,
    markerId?: number,
    adminId?: number,
  ): Promise<BaseResponseDto<AttendanceCheckInResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const attendanceRepository = repos.attendanceRepository

      const existing = await attendanceRepository.findById(attendanceId)
      if (!existing) {
        throw new NotFoundException(`Điểm danh với ID ${attendanceId} không tồn tại`)
      }

      const session = await repos.classSessionRepository.findById(existing.sessionId)
      if (session?.courseClass?.course?.isEnded) {
        throw new ConflictException('Khóa học đã kết thúc, không thể hủy điểm danh')
      }

      const student = await repos.studentRepository.findById(existing.studentId)
      if (!student) {
        throw new NotFoundException(`Học sinh với ID ${existing.studentId} không tồn tại`)
      }

      if (!student.user?.isActive) {
        throw new ForbiddenException('Học sinh đã bị vô hiệu hóa, không thể hủy điểm danh')
      }

      if (existing.status !== AttendanceStatus.PRESENT) {
        throw new ConflictException('Chỉ có thể hủy điểm danh khi học sinh đang ở trạng thái Có mặt')
      }

      const attendance = await attendanceRepository.update(attendanceId, {
        status: AttendanceStatus.ABSENT,
        attendanceType: AttendanceType.REGULAR,
        markedAt: new Date(),
        markerId,
        makeupByAttendanceId: null,
      })

      // Gỡ các buổi vắng đã được bản ghi này bù (thử nối sang bản ghi Có mặt khác), rồi nối chính bản ghi vừa hủy
      const { releasedAbsenceCount } = await this.attendanceMakeupLinkService.reconcile(repos, attendance, {
        status: existing.status,
        attendanceType: existing.attendanceType,
      })

      // Đồng bộ điểm thưởng điểm danh về 0 (idempotent theo attendanceId)
      await this.studentPointService.awardAttendancePoints(repos, {
        studentId: attendance.studentId,
        attendanceId: attendance.attendanceId,
        status: attendance.status,
        attendanceType: attendance.attendanceType,
        sessionId: attendance.sessionId,
      })

      if (adminId) {
        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.ATTENDANCE.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.ATTENDANCE,
          resourceId: attendance.attendanceId.toString(),
          beforeData: {
            sessionId: existing.sessionId,
            studentId: existing.studentId,
            status: existing.status,
            attendanceType: existing.attendanceType,
          },
          afterData: {
            sessionId: attendance.sessionId,
            studentId: attendance.studentId,
            status: attendance.status,
            attendanceType: attendance.attendanceType,
            makeupByAttendanceId: attendance.makeupByAttendanceId,
            releasedAbsenceCount,
          },
        })
      }

      // Thông báo trong app cho học sinh (không gửi tin cho phụ huynh)
      const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
      await this.createAndNotifyOne.executeWithRepos(
        repos,
        {
          userId: student.userId,
          title: 'Cập nhật điểm danh',
          message: `Điểm danh của bạn đã được cập nhật thành: ${statusLabel}${attendance.attendanceType === AttendanceType.MAKEUP ? `; loại: ${AttendanceTypeLabels[attendance.attendanceType]}` : ''}`,
          type: NotificationType.ATTENDANCE,
          level: NotificationLevel.INFO,
          data: {
            attendanceId: attendance.attendanceId,
            sessionId: attendance.sessionId,
            status: attendance.status,
            attendanceType: attendance.attendanceType,
          },
        },
        {
          sourceType: 'ATTENDANCE',
          sourceId: String(attendance.attendanceId),
          sourceEvent: 'UPDATED',
          idempotencyKey: `attendance:${attendance.attendanceId}:student:updated:${attendance.status}:${attendance.attendanceType}`,
        },
      )

      // Đọc lại để response có đủ quan hệ (makeupBy, madeUpAbsences)
      const refreshed = (await attendanceRepository.findById(attendanceId)) ?? attendance

      // Thông báo nền cho phụ huynh (in-app + push + Zalo OA): trạng thái điểm danh đã thay đổi
      await this.attendanceNotificationService.enqueueAttendanceEvent(repos, refreshed, 'STATUS_CHANGED')

      return { attendance: refreshed, linkedAbsenceCount: releasedAbsenceCount }
    })

    return BaseResponseDto.success(
      'Hủy điểm danh thành công',
      new AttendanceCheckInResponseDto(result.attendance, result.linkedAbsenceCount),
    )
  }
}
