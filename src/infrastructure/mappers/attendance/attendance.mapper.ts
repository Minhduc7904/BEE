// src/infrastructure/mappers/attendance.mapper.ts
import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { ClassSessionMapper } from '../class/class-session.mapper'
import { StudentMapper } from '../user/student.mapper'
import { AdminMapper } from '../user/admin.mapper'
import { AttendanceStatus, AttendanceType } from 'src/shared/enums'

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
            attendanceType: prismaAttendance.attendanceType as AttendanceType,
            markedAt: prismaAttendance.markedAt,
            updatedAt: prismaAttendance.updatedAt ?? undefined,
            notes: prismaAttendance.notes ?? null,
            markerId: prismaAttendance.markerId ?? null,
            parentNotified: prismaAttendance.parentNotified ?? false,
            makeupByAttendanceId: prismaAttendance.makeupByAttendanceId ?? null,
            classSession: prismaAttendance.classSession
                ? ClassSessionMapper.toDomainClassSession(prismaAttendance.classSession)
                : undefined,
            student: prismaAttendance.student
                ? StudentMapper.toDomainStudent(prismaAttendance.student)
                : undefined,
            marker: prismaAttendance.marker
                ? AdminMapper.toDomainAdmin(prismaAttendance.marker)
                : null,
            // Chỉ map một cấp: makeupBy / madeUpAbsences không tải thêm quan hệ đệ quy.
            makeupBy: prismaAttendance.makeupBy
                ? AttendanceMapper.toDomainAttendance(prismaAttendance.makeupBy)
                : undefined,
            madeUpAbsences: prismaAttendance.madeUpAbsences
                ? AttendanceMapper.toDomainAttendances(prismaAttendance.madeUpAbsences)
                : undefined,
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
