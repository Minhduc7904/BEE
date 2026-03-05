import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { NotificationType, NotificationLevel } from 'src/shared/enums'

@Injectable()
export class DeleteAttendanceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
  ) {}

  async execute(
    attendanceId: number,
    adminId?: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const attendanceRepository = repos.attendanceRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const existing = await attendanceRepository.findById(attendanceId)

      if (!existing) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.ATTENDANCE.DELETE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.ATTENDANCE,
            resourceId: attendanceId.toString(),
            errorMessage: `Điểm danh với ID ${attendanceId} không tồn tại`,
          })
        }
        throw new NotFoundException(`Điểm danh với ID ${attendanceId} không tồn tại`)
      }

      const deleted = await attendanceRepository.delete(attendanceId)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.ATTENDANCE.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.ATTENDANCE,
          resourceId: attendanceId.toString(),
          beforeData: existing,
        })
      }

      // Gửi thông báo cho học sinh
      const student = await repos.studentRepository.findById(existing.studentId)
      if (student) {
        this.createAndNotifyOne.execute({
          userId: student.userId,
          title: 'Xóa điểm danh',
          message: 'Điểm danh của bạn đã bị xóa',
          type: NotificationType.ATTENDANCE,
          level: NotificationLevel.WARNING,
          data: { sessionId: existing.sessionId },
        }).catch(() => { /* ignore notification error */ })
      }

      return { deleted }
    })

    return BaseResponseDto.success('Xóa điểm danh thành công', result)
  }
}
