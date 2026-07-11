import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceResponseDto } from 'src/application/dtos/attendance/attendance.dto'
import { CreateAttendanceDto } from 'src/application/dtos/attendance/create-attendance.dto'
import { CreateAttendanceData } from 'src/domain/interface/attendance/attendance.interface'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { ConflictException, ForbiddenException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { NotificationType, NotificationLevel, AttendanceStatusLabels } from 'src/shared/enums'
import { SendAttendanceToParentUseCase } from './send-attendance-to-parent.use-case'
import { AttendanceStatus } from 'src/shared/enums'
import { StudentPointService } from 'src/application/services/student-point.service'

@Injectable()
export class CreateAttendanceUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
        private readonly sendAttendanceToParentUseCase: SendAttendanceToParentUseCase,
        private readonly studentPointService: StudentPointService,
    ) { }

    async execute(
        dto: CreateAttendanceDto,
        markerId?: number,
        adminId?: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const attendanceRepository = repos.attendanceRepository
            const classSessionRepository = repos.classSessionRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const session = await classSessionRepository.findById(dto.sessionId)
            if (!session) {
                throw new NotFoundException(`Buổi học với ID ${dto.sessionId} không tồn tại`)
            }

            if (session.courseClass?.course?.isEnded) {
                throw new ConflictException('Khóa học đã kết thúc, không thể điểm danh')
            }

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

            const student = await repos.studentRepository.findById(dto.studentId)
            if (!student) {
                throw new NotFoundException(`Học sinh với ID ${dto.studentId} không tồn tại`)
            }

            if (!student.user?.isActive) {
                throw new ForbiddenException('Học sinh đã bị vô hiệu hóa, không thể điểm danh')
            }

            const data: CreateAttendanceData = {
                sessionId: dto.sessionId,
                studentId: dto.studentId,
                status: dto.status,
                notes: dto.notes,
                markerId,
            }

            const attendance = await attendanceRepository.create(data)
            await this.studentPointService.awardAttendancePoints(repos, {
                studentId: attendance.studentId,
                attendanceId: attendance.attendanceId,
                status: attendance.status,
                sessionId: attendance.sessionId,
            })

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
            const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
            this.createAndNotifyOne.execute({
                userId: student.userId,
                title: 'Điểm danh mới',
                message: `Bạn đã được điểm danh với trạng thái: ${statusLabel}`,
                type: NotificationType.ATTENDANCE,
                level: NotificationLevel.INFO,
                data: { attendanceId: attendance.attendanceId, sessionId: attendance.sessionId, status: attendance.status },
            }).catch(() => { /* ignore notification error */ })

            return {
                response: new AttendanceResponseDto(attendance),
                attendanceId: attendance.attendanceId,
            }
        })

        // Gửi Zalo sau khi transaction đã commit để tránh đọc dữ liệu cũ/chưa commit
        if (dto.status !== AttendanceStatus.ABSENT) {
            await this.sendAttendanceToParentUseCase.execute({
                attendanceId: result.attendanceId,
            }).catch(() => { /* ignore zalo notify error */ })
        }

        return BaseResponseDto.success('Tạo điểm danh thành công', result.response)
    }
}
