import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class DeleteAttendanceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
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
          beforeData: {
            sessionId: existing.sessionId,
            studentId: existing.studentId,
            status: existing.status,
          },
        })
      }

      return { deleted }
    })

    return BaseResponseDto.success('Xóa điểm danh thành công', result)
  }
}
