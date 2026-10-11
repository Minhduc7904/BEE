import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceResponseDto } from 'src/application/dtos/attendance/attendance.dto'
import { UpdateAttendanceDto } from 'src/application/dtos/attendance/update-attendance.dto'
import { UpdateAttendanceData } from 'src/domain/interface/attendance/attendance.interface'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { NotFoundException, ForbiddenException, ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { NotificationType, NotificationLevel, AttendanceStatus, AttendanceStatusLabels, AttendanceType, AttendanceTypeLabels } from 'src/shared/enums'
import { SendAttendanceToParentUseCase } from './send-attendance-to-parent.use-case'
import { StudentPointService } from 'src/application/services/student-point.service'
import { AttendanceMakeupLinkService } from 'src/application/services/attendance-makeup-link.service'

@Injectable()
export class UpdateAttendanceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
    private readonly sendAttendanceToParentUseCase: SendAttendanceToParentUseCase,
    private readonly studentPointService: StudentPointService,
    private readonly attendanceMakeupLinkService: AttendanceMakeupLinkService,
  ) {}

  async execute(
    attendanceId: number,
    dto: UpdateAttendanceDto,
    markerId?: number,
    adminId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const attendanceRepository = repos.attendanceRepository
      const classSessionRepository = repos.classSessionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const existing = await attendanceRepository.findById(attendanceId)

      if (!existing) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.ATTENDANCE.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.ATTENDANCE,
            resourceId: attendanceId.toString(),
            errorMessage: `Điểm danh với ID ${attendanceId} không tồn tại`,
          })
        }
        throw new NotFoundException(`Điểm danh với ID ${attendanceId} không tồn tại`)
      }

      const session = await classSessionRepository.findById(existing.sessionId)
      if (session?.courseClass?.course?.isEnded) {
        throw new ConflictException('Khóa học đã kết thúc, không thể cập nhật điểm danh')
      }

      const student = await repos.studentRepository.findById(existing.studentId)
      if (!student) {
        throw new NotFoundException(`Học sinh với ID ${existing.studentId} không tồn tại`)
      }

      if (!student.user?.isActive) {
        throw new ForbiddenException('Học sinh đã bị vô hiệu hóa, không thể cập nhật điểm danh')
      }

      const data: UpdateAttendanceData = {}
      const statusChanged = dto.status !== undefined && dto.status !== existing.status
      const attendanceTypeChanged = dto.attendanceType !== undefined && dto.attendanceType !== existing.attendanceType

      // Chỉ gán các trường thực sự thay đổi
      if (statusChanged) {
        data.status = dto.status

        // Nếu chuyển sang trạng thái có mặt → cập nhật thời điểm điểm danh
        data.markedAt = new Date()

        // Có mặt / Muộn không phải buổi vắng nên không còn "đã được học bù"
        if (dto.status !== AttendanceStatus.ABSENT && existing.makeupByAttendanceId != null) {
          data.makeupByAttendanceId = null
        }
      }
      if (attendanceTypeChanged) {
        data.attendanceType = dto.attendanceType
      }

      if (dto.notes !== undefined && dto.notes !== existing.notes) {
        data.notes = dto.notes
      }

      if (markerId !== undefined && markerId !== existing.markerId) {
        data.markerId = markerId
      }

      // Không có gì thay đổi → trả về dữ liệu cũ
      if (Object.keys(data).length === 0) {
        return {
          response: new AttendanceResponseDto(existing),
          attendanceId: existing.attendanceId,
          statusChanged: false,
          notification: null,
        }
      }

      const attendance = await attendanceRepository.update(attendanceId, data)

      // Tự nối / gỡ liên kết học bù theo quy tắc nghiệp vụ
      if (statusChanged) {
        if (existing.status === AttendanceStatus.PRESENT) {
          // Có mặt → trạng thái khác: gỡ các buổi vắng đã được bản ghi này bù và thử nối sang bản ghi khác
          await this.attendanceMakeupLinkService.releaseMadeUpAbsences(repos, attendance.attendanceId)
        }

        if (attendance.status === AttendanceStatus.PRESENT) {
          await this.attendanceMakeupLinkService.linkAbsencesTo(repos, attendance)
        } else if (attendance.status === AttendanceStatus.ABSENT) {
          await this.attendanceMakeupLinkService.linkAbsenceToMakeup(repos, attendance)
        }
      } else if (attendanceTypeChanged && attendance.status === AttendanceStatus.PRESENT) {
        if (attendance.attendanceType === AttendanceType.MAKEUP) {
          await this.attendanceMakeupLinkService.linkAbsencesTo(repos, attendance)
        } else {
          await this.attendanceMakeupLinkService.releaseMadeUpAbsences(repos, attendance.attendanceId)
        }
      }
      await this.studentPointService.awardAttendancePoints(repos, {
        studentId: attendance.studentId,
        attendanceId: attendance.attendanceId,
        status: attendance.status,
        attendanceType: attendance.attendanceType,
        sessionId: attendance.sessionId,
      })

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.ATTENDANCE.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.ATTENDANCE,
          resourceId: attendance.attendanceId.toString(),
          beforeData: existing,
          afterData: attendance,
        })
      }

      // Gửi thông báo cho học sinh
      const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
      const notification = {
        userId: student.userId,
        title: 'Cập nhật điểm danh',
        message: `Điểm danh của bạn đã được cập nhật thành: ${statusLabel}${attendance.attendanceType === AttendanceType.MAKEUP ? `; loại: ${AttendanceTypeLabels[attendance.attendanceType]}` : ''}`,
        type: NotificationType.ATTENDANCE,
        level: NotificationLevel.INFO,
        data: { attendanceId: attendance.attendanceId, sessionId: attendance.sessionId, status: attendance.status, attendanceType: attendance.attendanceType },
      }

      await this.createAndNotifyOne.executeWithRepos(repos, notification, {
        sourceType: 'ATTENDANCE',
        sourceId: String(attendance.attendanceId),
        sourceEvent: 'UPDATED',
        idempotencyKey: `attendance:${attendance.attendanceId}:student:updated:${attendance.status}:${attendance.attendanceType}`,
      })
      // TẠM TẮT: gửi tin phụ huynh khi điểm danh, sẽ xử lý sau
      // if (statusChanged || attendanceTypeChanged) {
      //   await this.sendAttendanceToParentUseCase.executeWithRepos(repos, { attendanceId: attendance.attendanceId })
      // }

      return {
        response: new AttendanceResponseDto(attendance),
      }
    })

    return BaseResponseDto.success('Cập nhật điểm danh thành công', result.response)
  }
}
