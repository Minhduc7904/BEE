// src/infrastructure/mappers/attendance.mapper.ts
import { Attendance } from '../../domain/entities/attendance/attendance.entity'
import { ClassSessionMapper } from './class-session.mapper'
import { StudentMapper } from './student.mapper'
import { AdminMapper } from './admin.mapper'
import { AttendanceStatus } from 'src/shared/enums'

/**
 * Mapper class để convert từ Prisma Attendance model
 * sang Domain Attendance entity
 */
export class AttendanceMapper {
    /**
     * Convert Prisma Attendance sang Domain Attendance
     */
    static toDomainAttendance(prismaAttendance: any): Attendance | undefined {
        if (!prismaAttendance) return undefined

        return new Attendance(
            prismaAttendance.attendanceId,
            prismaAttendance.sessionId,
            prismaAttendance.studentId,
            prismaAttendance.status as AttendanceStatus,
            prismaAttendance.markedAt,
            prismaAttendance.notes ?? null,
            prismaAttendance.updatedAt ?? undefined,
            prismaAttendance.markerId ?? null,
            prismaAttendance.classSession
                ? ClassSessionMapper.toDomainClassSession(prismaAttendance.classSession)
                : undefined,
            prismaAttendance.student
                ? StudentMapper.toDomainStudent(prismaAttendance.student)
                : undefined,
            prismaAttendance.marker
                ? AdminMapper.toDomainAdmin(prismaAttendance.marker)
                : null,
        )
    }

    /**
     * Convert array Prisma Attendances sang array Domain Attendances
     */
    static toDomainAttendances(prismaAttendances: any[]): Attendance[] {
        return prismaAttendances
            .map((attendance) => this.toDomainAttendance(attendance))
            .filter(Boolean) as Attendance[]
    }
}
