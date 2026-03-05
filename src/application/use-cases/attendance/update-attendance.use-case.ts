import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceResponseDto } from 'src/application/dtos/attendance/attendance.dto'
import { UpdateAttendanceDto } from 'src/application/dtos/attendance/update-attendance.dto'
import { UpdateAttendanceData } from 'src/domain/interface/attendance/attendance.interface'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { NotificationType, NotificationLevel, AttendanceStatus, AttendanceStatusLabels } from 'src/shared/enums'

@Injectable()
export class UpdateAttendanceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
  ) {}

  async execute(
    attendanceId: number,
    dto: UpdateAttendanceDto,
    markerId?: number,
    adminId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const attendanceRepository = repos.attendanceRepository
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

      const data: UpdateAttendanceData = {}

      // Chỉ gán các trường thực sự thay đổi
      if (dto.status !== undefined && dto.status !== existing.status) {
        data.status = dto.status

        // Nếu chuyển sang trạng thái có mặt → cập nhật thời điểm điểm danh
          data.markedAt = new Date()
      }

      if (dto.notes !== undefined && dto.notes !== existing.notes) {
        data.notes = dto.notes
      }

      if (markerId !== undefined && markerId !== existing.markerId) {
        data.markerId = markerId
      }

      // Không có gì thay đổi → trả về dữ liệu cũ
      if (Object.keys(data).length === 0) {
        return new AttendanceResponseDto(existing)
      }

      const attendance = await attendanceRepository.update(attendanceId, data)

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
      const student = await repos.studentRepository.findById(attendance.studentId)
      if (student) {
        const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
        this.createAndNotifyOne.execute({
          userId: student.userId,
          title: 'Cập nhật điểm danh',
          message: `Điểm danh của bạn đã được cập nhật thành: ${statusLabel}`,
          type: NotificationType.ATTENDANCE,
          level: NotificationLevel.INFO,
          data: { attendanceId: attendance.attendanceId, sessionId: attendance.sessionId, status: attendance.status },
        }).catch(() => { /* ignore notification error */ })
      }

      return new AttendanceResponseDto(attendance)
    })

    return BaseResponseDto.success('Cập nhật điểm danh thành công', result)
  }
}
