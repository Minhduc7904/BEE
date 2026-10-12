import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceCheckInResponseDto } from 'src/application/dtos/attendance/check-in-attendance-response.dto'
import { CheckInAttendanceDto } from 'src/application/dtos/attendance/check-in-attendance.dto'
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
import {
  AttendanceMakeupLinkService,
  normalizeAttendanceType,
} from 'src/application/services/attendance-makeup-link.service'
import { AttendanceNotificationService } from 'src/application/services/attendance-notification.service'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'

/**
 * Điểm danh (check-in) một học sinh vào buổi học.
 *
 * Hệ thống tự tính trạng thái và loại điểm danh:
 * - Đã Có mặt: trả nguyên trạng (idempotent).
 * - Đang Vắng / Muộn: chuyển sang Có mặt, gỡ liên kết "đã được bù" của chính bản ghi.
 * - Chưa có bản ghi: tạo Có mặt, loại Chính khóa.
 * Loại điểm danh không tự nâng thành Học bù. Bản ghi Học bù (Muộn → Có mặt) giữ nguyên liên kết;
 * bản ghi Vắng được chuẩn hóa về Chính khóa nên chuyển sang Có mặt vẫn là Chính khóa.
 */
@Injectable()
export class CheckInAttendanceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
    private readonly studentPointService: StudentPointService,
    private readonly attendanceMakeupLinkService: AttendanceMakeupLinkService,
    private readonly attendanceNotificationService: AttendanceNotificationService,
  ) {}

  async execute(
    dto: CheckInAttendanceDto,
    markerId?: number,
    adminId?: number,
  ): Promise<BaseResponseDto<AttendanceCheckInResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const attendanceRepository = repos.attendanceRepository

      const session = await repos.classSessionRepository.findById(dto.sessionId)
      if (!session) {
        throw new NotFoundException(`Buổi học với ID ${dto.sessionId} không tồn tại`)
      }

      if (session.courseClass?.course?.isEnded) {
        throw new ConflictException('Khóa học đã kết thúc, không thể điểm danh')
      }

      const student = await repos.studentRepository.findById(dto.studentId)
      if (!student) {
        throw new NotFoundException(`Học sinh với ID ${dto.studentId} không tồn tại`)
      }

      if (!student.user?.isActive) {
        throw new ForbiddenException('Học sinh đã bị vô hiệu hóa, không thể điểm danh')
      }

      const existing = await attendanceRepository.findBySessionAndStudent(dto.sessionId, dto.studentId)

      // Đã Có mặt → trả nguyên trạng, không thay đổi dữ liệu
      if (existing && existing.status === AttendanceStatus.PRESENT) {
        const current = (await attendanceRepository.findById(existing.attendanceId)) ?? existing
        return {
          attendance: current,
          linkedAbsenceCount: current.madeUpAbsences?.length ?? 0,
        }
      }

      let attendance = existing
        ? await attendanceRepository.update(existing.attendanceId, {
            status: AttendanceStatus.PRESENT,
            attendanceType: normalizeAttendanceType(
              AttendanceStatus.PRESENT,
              normalizeAttendanceType(existing.status, existing.attendanceType),
            ),
            markedAt: new Date(),
            markerId,
            // Có mặt không còn là buổi vắng nên không còn "đã được bù"
            makeupByAttendanceId: null,
          })
        : await attendanceRepository.create({
            sessionId: dto.sessionId,
            studentId: dto.studentId,
            status: AttendanceStatus.PRESENT,
            attendanceType: AttendanceType.REGULAR,
            markerId,
          })

      const { linkedAbsenceCount } = await this.attendanceMakeupLinkService.reconcile(
        repos,
        attendance,
        existing ? { status: existing.status, attendanceType: existing.attendanceType } : null,
      )

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
          actionKey: existing ? ACTION_KEYS.ATTENDANCE.UPDATE : ACTION_KEYS.ATTENDANCE.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.ATTENDANCE,
          resourceId: attendance.attendanceId.toString(),
          ...(existing
            ? {
                beforeData: {
                  sessionId: existing.sessionId,
                  studentId: existing.studentId,
                  status: existing.status,
                  attendanceType: existing.attendanceType,
                  makeupByAttendanceId: existing.makeupByAttendanceId,
                },
              }
            : {}),
          afterData: {
            sessionId: attendance.sessionId,
            studentId: attendance.studentId,
            status: attendance.status,
            attendanceType: attendance.attendanceType,
            linkedAbsenceCount,
          },
        })
      }

      // Thông báo trong app cho học sinh (không gửi tin cho phụ huynh)
      const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
      await this.createAndNotifyOne.executeWithRepos(
        repos,
        {
          userId: student.userId,
          title: existing ? 'Cập nhật điểm danh' : 'Điểm danh mới',
          message: `${existing ? 'Điểm danh của bạn đã được cập nhật thành' : 'Bạn đã được điểm danh với trạng thái'}: ${statusLabel}${attendance.attendanceType === AttendanceType.MAKEUP ? `; loại: ${AttendanceTypeLabels[attendance.attendanceType]}` : ''}`,
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
          sourceEvent: existing ? 'UPDATED' : 'CREATED',
          idempotencyKey: `attendance:${attendance.attendanceId}:student:${existing ? 'updated' : 'created'}:${attendance.status}:${attendance.attendanceType}`,
        },
      )

      // Đọc lại để response có đủ quan hệ (makeupBy, madeUpAbsences)
      attendance = (await attendanceRepository.findById(attendance.attendanceId)) ?? attendance

      // Thông báo nền cho phụ huynh (in-app + push + Zalo OA): con đã đến lớp. Nhánh đã Có mặt từ trước đã return ở trên.
      await this.attendanceNotificationService.enqueueAttendanceEvent(repos, attendance, 'ARRIVED')

      return { attendance, linkedAbsenceCount }
    })

    return BaseResponseDto.success(
      'Điểm danh thành công',
      new AttendanceCheckInResponseDto(result.attendance, result.linkedAbsenceCount),
    )
  }
}
