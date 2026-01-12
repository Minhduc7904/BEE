// src/domain/entities/attendance/attendance.entity.ts
import { AttendanceStatus } from '@prisma/client'
import { ClassSession } from '../class-session/class-session.entity'
import { Student } from '../user/student.entity'
import { Admin } from '../user/admin.entity'

export class Attendance {
    attendanceId: number
    sessionId: number
    studentId: number
    status: AttendanceStatus
    markedAt: Date
    notes?: string | null
    updatedAt?: Date
    markerId?: number | null

    // Relations
    classSession?: ClassSession
    student?: Student
    marker?: Admin | null

    constructor(
        attendanceId: number,
        sessionId: number,
        studentId: number,
        status: AttendanceStatus,
        markedAt: Date,
        notes?: string | null,
        updatedAt?: Date,
        markerId?: number | null,
        classSession?: ClassSession,
        student?: Student,
        marker?: Admin | null,
    ) {
        this.attendanceId = attendanceId
        this.sessionId = sessionId
        this.studentId = studentId
        this.status = status
        this.markedAt = markedAt
        this.notes = notes
        this.updatedAt = updatedAt
        this.markerId = markerId
        this.classSession = classSession
        this.student = student
        this.marker = marker
    }

    /**
     * Có mặt
     */
    isPresent(): boolean {
        return this.status === AttendanceStatus.PRESENT
    }

    /**
     * Vắng mặt
     */
    isAbsent(): boolean {
        return this.status === AttendanceStatus.ABSENT
    }

    /**
     * Đi muộn
     */
    isLate(): boolean {
        return this.status === AttendanceStatus.LATE
    }

    /**
     * Học bù
     */
    isMakeup(): boolean {
        return this.status === AttendanceStatus.MAKEUP
    }

    /**
     * Đã được điểm danh chưa
     */
    isMarked(): boolean {
        return this.status !== undefined && this.markedAt !== undefined
    }

    /**
     * Có ghi chú không
     */
    hasNotes(): boolean {
        return !!this.notes && this.notes.trim().length > 0
    }

    /**
     * Điểm danh hợp lệ
     */
    isValid(): boolean {
        return (
            this.attendanceId > 0 &&
            this.sessionId > 0 &&
            this.studentId > 0 &&
            this.markedAt !== undefined
        )
    }

    /**
     * Có thể chỉnh sửa không
     */
    canEdit(): boolean {
        return this.isValid()
    }

    /**
     * Đánh dấu có mặt
     */
    markPresent(markerId?: number): void {
        this.status = AttendanceStatus.PRESENT
        this.markedAt = new Date()
        if (markerId) {
            this.markerId = markerId
        }
    }

    /**
     * Đánh dấu vắng mặt
     */
    markAbsent(markerId?: number, notes?: string): void {
        this.status = AttendanceStatus.ABSENT
        this.markedAt = new Date()
        if (markerId) {
            this.markerId = markerId
        }
        if (notes) {
            this.notes = notes
        }
    }

    /**
     * Đánh dấu đi muộn
     */
    markLate(markerId?: number, notes?: string): void {
        this.status = AttendanceStatus.LATE
        this.markedAt = new Date()
        if (markerId) {
            this.markerId = markerId
        }
        if (notes) {
            this.notes = notes
        }
    }

    /**
     * Đánh dấu học bù
     */
    markMakeup(markerId?: number, notes?: string): void {
        this.status = AttendanceStatus.MAKEUP
        this.markedAt = new Date()
        if (markerId) {
            this.markerId = markerId
        }
        if (notes) {
            this.notes = notes
        }
    }

    /**
     * Cập nhật ghi chú
     */
    updateNotes(notes: string): void {
        this.notes = notes
        this.updatedAt = new Date()
    }

    /**
     * Lấy label trạng thái (tiếng Việt)
     */
    getStatusLabel(): string {
        switch (this.status) {
            case AttendanceStatus.PRESENT:
                return 'Có mặt'
            case AttendanceStatus.ABSENT:
                return 'Vắng mặt'
            case AttendanceStatus.LATE:
                return 'Đi muộn'
            case AttendanceStatus.MAKEUP:
                return 'Học bù'
            default:
                return 'Chưa xác định'
        }
    }

    /**
     * Lấy màu badge cho trạng thái
     */
    getStatusColor(): string {
        switch (this.status) {
            case AttendanceStatus.PRESENT:
                return 'green'
            case AttendanceStatus.ABSENT:
                return 'red'
            case AttendanceStatus.LATE:
                return 'orange'
            case AttendanceStatus.MAKEUP:
                return 'blue'
            default:
                return 'gray'
        }
    }

    /**
     * Kiểm tra có phải điểm danh tích cực không (có mặt hoặc học bù)
     */
    isPositiveAttendance(): boolean {
        return this.isPresent() || this.isMakeup()
    }

    /**
     * Kiểm tra có phải điểm danh tiêu cực không (vắng mặt)
     */
    isNegativeAttendance(): boolean {
        return this.isAbsent()
    }

    /**
     * Tính điểm attendance (có thể dùng cho hệ thống điểm danh)
     * PRESENT = 1, MAKEUP = 0.8, LATE = 0.5, ABSENT = 0
     */
    getAttendanceScore(): number {
        switch (this.status) {
            case AttendanceStatus.PRESENT:
                return 1.0
            case AttendanceStatus.MAKEUP:
                return 0.8
            case AttendanceStatus.LATE:
                return 0.5
            case AttendanceStatus.ABSENT:
                return 0.0
            default:
                return 0.0
        }
    }

    /**
     * Format thời gian điểm danh
     */
    getFormattedMarkedAt(): string {
        return this.markedAt.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    /**
     * Lấy tên người điểm danh
     */
    getMarkerName(): string {
        if (this.marker) {
            return `${this.marker.user?.firstName || ''} ${this.marker.user?.lastName || ''}`.trim()
        }
        return 'Hệ thống'
    }

    /**
     * Lấy tên học sinh
     */
    getStudentName(): string {
        if (this.student?.user) {
            return `${this.student.user.firstName || ''} ${this.student.user.lastName || ''}`.trim()
        }
        return `Học sinh #${this.studentId}`
    }

    /**
     * Clone attendance record
     */
    clone(): Attendance {
        return new Attendance(
            this.attendanceId,
            this.sessionId,
            this.studentId,
            this.status,
            this.markedAt,
            this.notes,
            this.updatedAt,
            this.markerId,
            this.classSession,
            this.student,
            this.marker,
        )
    }
}
