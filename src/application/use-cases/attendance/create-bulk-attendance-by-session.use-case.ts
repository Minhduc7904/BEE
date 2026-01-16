// src/application/use-cases/attendance/create-bulk-attendance-by-session.use-case.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { CreateBulkAttendanceBySessionDto } from '../../dtos/attendance/create-bulk-attendance-by-session.dto'
import { AttendanceResponseDto } from '../../dtos/attendance/attendance.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { PrismaService } from '../../../prisma/prisma.service'
import { AttendanceStatus } from 'src/shared/enums'
import type { CreateAttendanceData } from '../../../domain/interface/attendance/attendance.interface'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class CreateBulkAttendanceBySessionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly prisma: PrismaService,
    ) { }

    async execute(
        dto: CreateBulkAttendanceBySessionDto,
        markerId?: number,
        adminId?: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto[]>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const attendanceRepository = repos.attendanceRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // 1. Kiểm tra session có tồn tại không
            const session = await this.prisma.classSession.findUnique({
                where: { sessionId: dto.sessionId },
                include: {
                    courseClass: true,
                },
            })

            if (!session) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.ATTENDANCE.CREATE_BULK,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.ATTENDANCE,
                        errorMessage: `Buổi học với ID ${dto.sessionId} không tồn tại`,
                    })
                }
                throw new NotFoundException(
                    `Buổi học với ID ${dto.sessionId} không tồn tại`,
                )
            }

            // 2. Lấy tất cả học sinh trong lớp
            const classStudents = await this.prisma.classStudent.findMany({
                where: { classId: session.classId },
                select: { studentId: true },
            })

            if (classStudents.length === 0) {
                return []
            }

            // 3. Kiểm tra xem đã có attendance nào cho session này chưa
            const existingAttendances = await this.prisma.attendance.findMany({
                where: {
                    sessionId: dto.sessionId,
                },
                select: { studentId: true },
            })

            const existingStudentIds = new Set(
                existingAttendances.map((a) => a.studentId),
            )

            // 4. Lọc ra những học sinh chưa có attendance
            const studentsToCreate = classStudents.filter(
                (cs) => !existingStudentIds.has(cs.studentId),
            )

            if (studentsToCreate.length === 0) {
                return []
            }

            // 5. Tạo bulk attendance data
            const bulkData: CreateAttendanceData[] = studentsToCreate.map((cs) => ({
                sessionId: dto.sessionId,
                studentId: cs.studentId,
                status: dto.status || AttendanceStatus.PRESENT,
                notes: dto.notes,
                markerId,
            }))

            // 6. Tạo attendance hàng loạt
            const createdAttendances = await attendanceRepository.createBulk(bulkData)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.ATTENDANCE.CREATE_BULK,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.ATTENDANCE,
                    afterData: {
                        sessionId: dto.sessionId,
                        count: createdAttendances.length,
                    },
                })
            }

            // 7. Map sang DTO
            return createdAttendances.map((attendance) =>
                AttendanceResponseDto.fromEntity(attendance),
            )
        })

        if (result.length === 0) {
            return {
                success: true,
                message: 'Không có học sinh nào cần tạo attendance',
                data: [],
            }
        }

        return {
            success: true,
            message: `Đã tạo attendance cho ${result.length} học sinh`,
            data: result,
        }
    }
}
