// src/application/use-cases/attendance/create-bulk-attendance-by-session.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { CreateBulkAttendanceBySessionDto } from '../../dtos/attendance/create-bulk-attendance-by-session.dto'
import { AttendanceResponseDto } from '../../dtos/attendance/attendance.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { AttendanceStatus, AttendanceType, NotificationType, NotificationLevel, AttendanceStatusLabels, AttendanceTypeLabels } from 'src/shared/enums'
import type { CreateAttendanceData } from '../../../domain/interface/attendance/attendance.interface'
import { ValidationException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { CreateAndNotifyManyUseCase } from '../notification/create-and-notify-many.use-case'
import { SendBulkAttendanceToParentUseCase } from './send-bulk-attendance-to-parent.use-case'
import { StudentPointService } from 'src/application/services/student-point.service'
import { createHash } from 'crypto'

@Injectable()
export class CreateBulkAttendanceBySessionUseCase {
  private static readonly FIRST_ATTENDANCE_NOTE = `Lưu ý: Đây là điểm danh lần thứ 1. Nếu con có đi học, phụ huynh sẽ nhận được điểm danh lần thứ 2 khi con vào lớp.
Nếu con đã học một buổi tương đương, vui lòng bỏ qua thông báo này.
Nếu con đăng ký nhầm lớp, hãy chọn "Liên hệ hỗ trợ" để trợ giảng sắp xếp lại lịch học phù hợp.`

  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyMany: CreateAndNotifyManyUseCase,
    private readonly sendBulkAttendanceToParentUseCase: SendBulkAttendanceToParentUseCase,
    private readonly studentPointService: StudentPointService,
  ) {}

  async execute(
    dto: CreateBulkAttendanceBySessionDto,
    markerId?: number,
    adminId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto[]>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { attendanceRepository, adminAuditLogRepository, classSessionRepository, classStudentRepository } = repos

      try {
        /**
         * =========================
         * Validate session
         * =========================
         */
        const session = await classSessionRepository.findById(dto.sessionId)
        if (!session) {
          throw new NotFoundException(`Buổi học với ID ${dto.sessionId} không tồn tại`)
        }

        if (session.courseClass?.course?.isEnded) {
          throw new ValidationException('Khóa học đã kết thúc, không thể điểm danh')
        }

        /**
         * =========================
         * Get students in class
         * =========================
         */
        const classStudents = await classStudentRepository.findByClass(session.classId, true)

        if (classStudents.length === 0) {
          throw new ValidationException('Lớp học không có học sinh để tạo attendance')
        }

        const studentIds = classStudents.map((s) => s.studentId)

        /**
         * =========================
         * Check existing attendance
         * =========================
         */
        const existingAttendances = await attendanceRepository.findWithFilter({
          sessionId: dto.sessionId,
          studentIds,
        })

        const existingStudentIds = new Set(existingAttendances.map((a) => a.studentId))

        /**
         * =========================
         * Prepare bulk data
         * =========================
         */
        const bulkData: CreateAttendanceData[] = studentIds
          .filter((studentId) => !existingStudentIds.has(studentId))
          .map((studentId) => ({
            sessionId: dto.sessionId,
            studentId,
            status: dto.status || AttendanceStatus.PRESENT,
            attendanceType: dto.attendanceType ?? AttendanceType.REGULAR,
            notes: dto.notes,
            markerId,
          }))

        if (bulkData.length === 0) {
          return {
            responses: [] as AttendanceResponseDto[],
            attendanceIds: [] as number[],
            notifications: [],
          }
        }

        /**
         * =========================
         * Create bulk attendance
         * =========================
         */
        const createdAttendances = await attendanceRepository.createBulk(bulkData)
        await Promise.all(
          createdAttendances.map((attendance) =>
            this.studentPointService.awardAttendancePoints(repos, {
              studentId: attendance.studentId,
              attendanceId: attendance.attendanceId,
              status: attendance.status,
              attendanceType: attendance.attendanceType,
              sessionId: attendance.sessionId,
            }),
          ),
        )

        /**
         * =========================
         * Audit SUCCESS
         * =========================
         */
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.ATTENDANCE.CREATE_BULK,
            status: AuditStatus.SUCCESS,
            resourceType: RESOURCE_TYPES.ATTENDANCE,
            afterData: {
              sessionId: dto.sessionId,
              createdCount: createdAttendances.length,
              attendanceIds: createdAttendances.map((a) => a.attendanceId),
            },
            beforeData: {
              requestedStudentIds: studentIds,
              skippedStudentIds: Array.from(existingStudentIds),
            },
          })
        }

        /**
         * =========================
         * Gửi thông báo cho học sinh
         * =========================
         */
        const createdStudentIds = createdAttendances.map((a) => a.studentId)
        const studentsToNotify = classStudents.filter(
          (s) => createdStudentIds.includes(s.studentId) && s.student?.userId,
        )

        if (studentsToNotify.length > 0) {
          const defaultStatus = dto.status || AttendanceStatus.PRESENT
          const statusLabel = AttendanceStatusLabels[defaultStatus] || defaultStatus
          const attendanceType = dto.attendanceType ?? AttendanceType.REGULAR

          const notificationDataList = studentsToNotify.map((cs) => ({
            userId: cs.student!.userId,
            title: 'Điểm danh mới',
            message: `Bạn đã được điểm danh với trạng thái: ${statusLabel}${attendanceType === AttendanceType.MAKEUP ? `; loại: ${AttendanceTypeLabels[attendanceType]}` : ''}`,
            type: NotificationType.ATTENDANCE,
            level: NotificationLevel.INFO,
            data: { sessionId: dto.sessionId, status: defaultStatus, attendanceType },
          }))

          const attendanceIds = createdAttendances.map((attendance) => attendance.attendanceId)
          const digest = createHash('sha256')
            .update([...attendanceIds].sort((a, b) => a - b).join(','))
            .digest('hex')
            .slice(0, 24)
          await this.createAndNotifyMany.executeWithRepos(repos, notificationDataList, {
            sourceType: 'ATTENDANCE',
            sourceId: `session:${dto.sessionId}:bulk:${digest}`,
            sourceEvent: 'BULK_CREATED',
            idempotencyKey: `attendance-bulk:${dto.sessionId}:${digest}:students`,
          })
          await this.sendBulkAttendanceToParentUseCase.executeWithRepos(repos, {
            attendanceIds,
            note: CreateBulkAttendanceBySessionUseCase.FIRST_ATTENDANCE_NOTE,
            includeZalo: false,
          })

          return {
            responses: createdAttendances.map((attendance) => AttendanceResponseDto.fromEntity(attendance)),
          }
        }

        return {
          responses: createdAttendances.map((attendance) => AttendanceResponseDto.fromEntity(attendance)),
          attendanceIds: createdAttendances.map((attendance) => attendance.attendanceId),
          notifications: [],
        }
      } catch (error) {
        /**
         * =========================
         * Audit FAIL
         * =========================
         */
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.ATTENDANCE.CREATE_BULK,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.ATTENDANCE,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
        }
        throw error
      }
    })

    return BaseResponseDto.success(
      result.responses.length > 0
        ? `Đã tạo attendance cho ${result.responses.length} học sinh`
        : 'Không có attendance nào được tạo',
      result.responses,
    )
  }
}
