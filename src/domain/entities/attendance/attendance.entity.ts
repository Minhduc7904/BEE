// src/domain/entities/attendance/attendance.entity.ts

import { AttendanceStatus } from '../../../shared/enums/attendance-status.enum'
import { ClassSession } from '../class-session/class-session.entity'
import { Student } from '../user/student.entity'
import { Admin } from '../user/admin.entity'

export class Attendance {
    // Required properties
    attendanceId: number
    sessionId: number
    studentId: number
    status: AttendanceStatus
    markedAt: Date
    createdAt?: Date
    updatedAt: Date

    // Optional properties
    notes?: string | null
    markerId?: number | null

    // Navigation properties
    classSession?: ClassSession
    student?: Student
    marker?: Admin | null

    constructor(data: {
        attendanceId: number
        sessionId: number
        studentId: number
        status: AttendanceStatus
        markedAt?: Date
        createdAt?: Date
        updatedAt?: Date
        notes?: string | null
        markerId?: number | null
        classSession?: ClassSession
        student?: Student
        marker?: Admin | null
    }) {
        this.attendanceId = data.attendanceId
        this.sessionId = data.sessionId
        this.studentId = data.studentId
        this.status = data.status
        this.markedAt = data.markedAt || new Date()
        this.createdAt = data.createdAt
        this.updatedAt = data.updatedAt || new Date()

        this.notes = data.notes
        this.markerId = data.markerId
        this.classSession = data.classSession
        this.student = data.student
        this.marker = data.marker
    }

    /* ===================== DOMAIN METHODS ===================== */

    isPresent(): boolean {
        return this.status === AttendanceStatus.PRESENT
    }

    isAbsent(): boolean {
        return this.status === AttendanceStatus.ABSENT
    }

    isLate(): boolean {
        return this.status === AttendanceStatus.LATE
    }

    isMakeup(): boolean {
        return this.status === AttendanceStatus.MAKEUP
    }

    isMarked(): boolean {
        return this.markedAt !== undefined
    }

    hasNotes(): boolean {
        return Boolean(this.notes && this.notes.trim().length > 0)
    }

    isValid(): boolean {
        return (
            this.attendanceId > 0 &&
            this.sessionId > 0 &&
            this.studentId > 0
        )
    }

    canEdit(): boolean {
        return this.isValid()
    }

    private mark(
        status: AttendanceStatus,
        markerId?: number,
        notes?: string,
    ): void {
        this.status = status
        this.markedAt = new Date()
        this.updatedAt = new Date()

        if (markerId !== undefined) {
            this.markerId = markerId
        }

        if (notes !== undefined) {
            this.notes = notes
        }
    }

    markPresent(markerId?: number): void {
        this.mark(AttendanceStatus.PRESENT, markerId)
    }

    markAbsent(markerId?: number, notes?: string): void {
        this.mark(AttendanceStatus.ABSENT, markerId, notes)
    }

    markLate(markerId?: number, notes?: string): void {
        this.mark(AttendanceStatus.LATE, markerId, notes)
    }

    markMakeup(markerId?: number, notes?: string): void {
        this.mark(AttendanceStatus.MAKEUP, markerId, notes)
    }

    updateNotes(notes: string): void {
        this.notes = notes
        this.updatedAt = new Date()
    }

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

    isPositiveAttendance(): boolean {
        return this.isPresent() || this.isMakeup()
    }

    isNegativeAttendance(): boolean {
        return this.isAbsent()
    }

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

    getFormattedMarkedAt(): string {
        return this.markedAt.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    getMarkerName(): string {
        if (!this.marker?.user) return 'Hệ thống'
        const { firstName, lastName } = this.marker.user
        return `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Hệ thống'
    }

    getStudentName(): string {
        if (!this.student?.user) {
            return `Học sinh #${this.studentId}`
        }
        const { firstName, lastName } = this.student.user
        return `${firstName ?? ''} ${lastName ?? ''}`.trim()
    }

    equals(other: Attendance): boolean {
        return this.attendanceId === other.attendanceId
    }

    toJSON() {
        return {
            attendanceId: this.attendanceId,
            sessionId: this.sessionId,
            studentId: this.studentId,
            status: this.status,
            markedAt: this.markedAt,
            notes: this.notes,
            markerId: this.markerId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): Attendance {
        return new Attendance({
            attendanceId: this.attendanceId,
            sessionId: this.sessionId,
            studentId: this.studentId,
            status: this.status,
            markedAt: this.markedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            notes: this.notes,
            markerId: this.markerId,
            classSession: this.classSession,
            student: this.student,
            marker: this.marker,
        })
    }
}
