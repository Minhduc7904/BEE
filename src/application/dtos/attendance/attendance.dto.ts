import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { StudentResponseDto } from '../student/student.dto'
import { AttendanceStatus } from '@prisma/client'
import { ClassSessionResponseDto } from '../class-session/class-session.dto'

export class AttendanceResponseDto {
    attendanceId: number
    sessionId: number
    studentId: number
    status: AttendanceStatus
    statusLabel: string
    markedAt: Date
    notes?: string | null
    updatedAt?: Date
    markerId?: number | null
    markerName?: string
    student?: StudentResponseDto | null
    classSession?: ClassSessionResponseDto | null

    constructor(attendance: Attendance) {
        this.attendanceId = attendance.attendanceId
        this.sessionId = attendance.sessionId
        this.studentId = attendance.studentId
        this.status = attendance.status
        this.statusLabel = attendance.getStatusLabel()
        this.markedAt = attendance.markedAt
        this.notes = attendance.notes
        this.updatedAt = attendance.updatedAt
        this.markerId = attendance.markerId
        this.markerName = attendance.getMarkerName()
        if (attendance.classSession) {
            this.classSession = ClassSessionResponseDto.fromEntity(attendance.classSession)
        }

        if (attendance.student) {
            this.student = StudentResponseDto.fromStudentEntity(attendance.student)
        }
    }

    static fromEntity(attendance: Attendance): AttendanceResponseDto {
        return new AttendanceResponseDto(attendance)
    }
}

export class AttendanceListResponseDto extends PaginationResponseDto<AttendanceResponseDto> {
    constructor(
        data: AttendanceResponseDto[],
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
        super(true, 'Lấy danh sách điểm danh thành công', data, meta)
    }
}
