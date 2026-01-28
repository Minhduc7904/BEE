// src/application/use-cases/attendance/create-bulk-attendance-by-session.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { CreateBulkAttendanceBySessionDto } from '../../dtos/attendance/create-bulk-attendance-by-session.dto'
import { AttendanceResponseDto } from '../../dtos/attendance/attendance.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { AttendanceStatus } from 'src/shared/enums'
import type { CreateAttendanceData } from '../../../domain/interface/attendance/attendance.interface'
import {
  ValidationException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class CreateBulkAttendanceBySessionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    dto: CreateBulkAttendanceBySessionDto,
    markerId?: number,
    adminId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto[]>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const {
        attendanceRepository,
        adminAuditLogRepository,
        classSessionRepository,
        classStudentRepository,
      } = repos

      try {
        /**
         * =========================
         * Validate session
         * =========================
         */
        const session = await classSessionRepository.findById(dto.sessionId)
        if (!session) {
          throw new NotFoundException(
            `Buổi học với ID ${dto.sessionId} không tồn tại`,
          )
        }

        /**
         * =========================
         * Get students in class
         * =========================
         */
        const classStudents =
          await classStudentRepository.findByClass(session.classId)

        if (classStudents.length === 0) {
          throw new ValidationException(
            'Lớp học không có học sinh để tạo attendance',
          )
        }

        const studentIds = classStudents.map((s) => s.studentId)

        /**
         * =========================
         * Check existing attendance
         * =========================
         */
        const existingAttendances =
          await attendanceRepository.findWithFilter({
            sessionId: dto.sessionId,
            studentIds,
          })

        const existingStudentIds = new Set(
          existingAttendances.map((a) => a.studentId),
        )

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
            notes: dto.notes,
            markerId,
          }))

        if (bulkData.length === 0) {
          return []
        }

        /**
         * =========================
         * Create bulk attendance
         * =========================
         */
        const createdAttendances =
          await attendanceRepository.createBulk(bulkData)

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
            },
            beforeData: {
              requestedStudentIds: studentIds,
              skippedStudentIds: Array.from(existingStudentIds),
            },
          })
        }

        return createdAttendances.map((attendance) =>
          AttendanceResponseDto.fromEntity(attendance),
        )
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
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
          })
        }
        throw error
      }
    })

    return BaseResponseDto.success(
      result.length > 0
        ? `Đã tạo attendance cho ${result.length} học sinh`
        : 'Không có attendance nào được tạo',
      result,
    )
  }
}
