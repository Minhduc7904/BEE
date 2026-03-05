import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceResponseDto } from 'src/application/dtos/attendance/attendance.dto'
import { CreateAttendanceDto } from 'src/application/dtos/attendance/create-attendance.dto'
import { CreateAttendanceData } from 'src/domain/interface/attendance/attendance.interface'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { NotificationType, NotificationLevel, AttendanceStatusLabels } from 'src/shared/enums'

@Injectable()
export class CreateAttendanceUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
    ) { }

    async execute(
        dto: CreateAttendanceDto,
        markerId?: number,
        adminId?: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const attendanceRepository = repos.attendanceRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Check if attendance already exists
            const existing = await attendanceRepository.findBySessionAndStudent(
                dto.sessionId,
                dto.studentId,
            )

            if (existing) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.ATTENDANCE.CREATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.ATTENDANCE,
                        errorMessage: 'Điểm danh cho học sinh này trong buổi học đã tồn tại',
                    })
                }
                throw new ConflictException(
                    'Điểm danh cho học sinh này trong buổi học đã tồn tại',
                )
            }

            const data: CreateAttendanceData = {
                sessionId: dto.sessionId,
                studentId: dto.studentId,
                status: dto.status,
                notes: dto.notes,
                markerId,
            }

            const attendance = await attendanceRepository.create(data)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.ATTENDANCE.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.ATTENDANCE,
                    resourceId: attendance.attendanceId.toString(),
                    afterData: {
                        sessionId: attendance.sessionId,
                        studentId: attendance.studentId,
                        status: attendance.status,
                    },
                })
            }

            // Gửi thông báo cho học sinh
            const student = await repos.studentRepository.findById(dto.studentId)
            if (student) {
                const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
                this.createAndNotifyOne.execute({
                    userId: student.userId,
                    title: 'Điểm danh mới',
                    message: `Bạn đã được điểm danh với trạng thái: ${statusLabel}`,
                    type: NotificationType.ATTENDANCE,
                    level: NotificationLevel.INFO,
                    data: { attendanceId: attendance.attendanceId, sessionId: attendance.sessionId, status: attendance.status },
                }).catch(() => { /* ignore notification error */ })
            }

            return new AttendanceResponseDto(attendance)
        })

        return BaseResponseDto.success('Tạo điểm danh thành công', result)
    }
}
