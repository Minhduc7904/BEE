// src/application/dtos/course/course-student-attendance.dto.ts
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { AttendanceStatus } from '@prisma/client'

/**
 * Single attendance record DTO
 */
export class AttendanceRecordDto {
    sessionId: number
    sessionName: string
    sessionDate: string // YYYY-MM-DD
    startTime: string // HH:mm
    endTime: string // HH:mm
    status: AttendanceStatus
    markedAt: string // ISO datetime
    notes?: string
    className: string

    static fromEntity(attendance: any): AttendanceRecordDto {
        const dto = new AttendanceRecordDto()
        // console.log('Attendance entity:', attendance);
        dto.sessionId = attendance.classSession?.sessionId
        dto.sessionName = attendance.classSession?.name
        dto.sessionDate = attendance.classSession?.sessionDate
            ? new Date(attendance.classSession.sessionDate).toISOString().split('T')[0]
            : ''
        dto.className = attendance.classSession?.courseClass?.className || ''
        dto.startTime = attendance.classSession?.startTime || ''
        dto.endTime = attendance.classSession?.endTime || ''
        dto.status = attendance.status
        dto.markedAt = attendance.markedAt ? attendance.markedAt.toISOString() : ''
        dto.notes = attendance.notes
        return dto
    }
}

/**
 * Student with attendance records DTO
 */
export class StudentAttendanceDto {
    studentId: number
    userId: number
    firstName: string
    lastName: string
    email?: string
    studentPhone?: string
    parentPhone?: string
    grade: number
    school?: string

    // Attendance statistics
    totalSessions: number
    presentCount: number
    absentCount: number
    lateCount: number
    makeupCount: number

    // Detailed attendance records
    attendances: AttendanceRecordDto[]

    static fromEntity(student: any, attendances: any[]): StudentAttendanceDto {
        const dto = new StudentAttendanceDto()

        dto.studentId = student.studentId
        dto.userId = student.user?.userId
        dto.firstName = student.user?.firstName
        dto.lastName = student.user?.lastName
        dto.email = student.user?.email
        dto.studentPhone = student.studentPhone
        dto.parentPhone = student.parentPhone
        dto.grade = student.grade
        dto.school = student.school

        // Calculate statistics
        dto.totalSessions = attendances.length
        dto.presentCount = attendances.filter(a => a.status === 'PRESENT').length
        dto.absentCount = attendances.filter(a => a.status === 'ABSENT').length
        dto.lateCount = attendances.filter(a => a.status === 'LATE').length
        dto.makeupCount = attendances.filter(a => a.status === 'MAKEUP').length

        // Map attendance records
        dto.attendances = attendances.map(a => AttendanceRecordDto.fromEntity(a))

        return dto
    }
}

/**
 * Paginated list response for students with attendance
 */
export class CourseStudentsAttendanceListResponseDto extends PaginationResponseDto<StudentAttendanceDto> {
    constructor(
        data: StudentAttendanceDto[],
        page: number,
        limit: number,
        total: number,
    ) {
        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasPrevious: page > 1,
            hasNext: page < Math.ceil(total / limit),
            previousPage: page > 1 ? page - 1 : undefined,
            nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
        }
        super(true, 'Lấy danh sách điểm danh học sinh thành công', data, meta)
    }
}
