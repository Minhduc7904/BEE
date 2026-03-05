// src/infrastructure/mappers/attendance.mapper.ts
import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { ClassSessionMapper } from '../class/class-session.mapper'
import { StudentMapper } from '../user/student.mapper'
import { AdminMapper } from '../user/admin.mapper'
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

        return new Attendance({
            attendanceId: prismaAttendance.attendanceId,
            sessionId: prismaAttendance.sessionId,
            studentId: prismaAttendance.studentId,
            status: prismaAttendance.status as AttendanceStatus,
            markedAt: prismaAttendance.markedAt,
            updatedAt: prismaAttendance.updatedAt ?? undefined,
            notes: prismaAttendance.notes ?? null,
            markerId: prismaAttendance.markerId ?? null,
            parentNotified: prismaAttendance.parentNotified ?? false,
            classSession: prismaAttendance.classSession
                ? ClassSessionMapper.toDomainClassSession(prismaAttendance.classSession)
                : undefined,
            student: prismaAttendance.student
                ? StudentMapper.toDomainStudent(prismaAttendance.student)
                : undefined,
            marker: prismaAttendance.marker
                ? AdminMapper.toDomainAdmin(prismaAttendance.marker)
                : null,
        })
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
