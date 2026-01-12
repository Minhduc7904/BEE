// src/application/use-cases/attendance/create-bulk-attendance-by-session.use-case.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IAttendanceRepository } from '../../../domain/repositories/attendance.repository'
import { CreateBulkAttendanceBySessionDto } from '../../dtos/attendance/create-bulk-attendance-by-session.dto'
import { AttendanceResponseDto } from '../../dtos/attendance/attendance.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { PrismaService } from '../../../prisma/prisma.service'
import { AttendanceStatus } from '@prisma/client'
import type { CreateAttendanceData } from '../../../domain/interface/attendance/attendance.interface'

@Injectable()
export class CreateBulkAttendanceBySessionUseCase {
    constructor(
        @Inject('IAttendanceRepository')
        private readonly attendanceRepository: IAttendanceRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(
        dto: CreateBulkAttendanceBySessionDto,
        markerId: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto[]>> {
        // 1. Kiểm tra session có tồn tại không
        const session = await this.prisma.classSession.findUnique({
            where: { sessionId: dto.sessionId },
            include: {
                courseClass: true,
            },
        })

        if (!session) {
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
            return {
                success: true,
                message: 'Không có học sinh nào trong lớp để tạo attendance',
                data: [],
            }
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
            return {
                success: true,
                message: 'Tất cả học sinh đã có attendance cho buổi học này',
                data: [],
            }
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
        const createdAttendances =
            await this.attendanceRepository.createBulk(bulkData)

        // 7. Map sang DTO
        const responseDtos = createdAttendances.map((attendance) =>
            AttendanceResponseDto.fromEntity(attendance),
        )

        return {
            success: true,
            message: `Đã tạo attendance cho ${responseDtos.length} học sinh`,
            data: responseDtos,
        }
    }
}
