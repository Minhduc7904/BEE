// src/domain/entities/course/class-session.entity.ts

import { CourseClass } from '../course-class/course-class.entity'

export class ClassSession {
    // Required properties
    sessionId: number
    classId: number
    name: string
    sessionDate: Date
    startTime: Date
    endTime: Date
    createdAt: Date
    updatedAt: Date

    // Optional properties
    makeupNote?: string | null

    // Navigation properties
    courseClass?: CourseClass

    constructor(data: {
        sessionId: number
        classId: number
        name: string
        sessionDate: Date
        startTime: Date
        endTime: Date
        createdAt?: Date
        updatedAt?: Date
        makeupNote?: string | null
        courseClass?: CourseClass
    }) {
        this.sessionId = data.sessionId
        this.classId = data.classId
        this.name = data.name
        this.sessionDate = data.sessionDate
        this.startTime = data.startTime
        this.endTime = data.endTime
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()

        this.makeupNote = data.makeupNote
        this.courseClass = data.courseClass
    }

    /* ===================== BUSINESS METHODS ===================== */

    /**
     * Khoảng thời gian hợp lệ không
     */
    isValidTimeRange(): boolean {
        return this.endTime > this.startTime
    }

    /**
     * Thời lượng buổi học (phút)
     */
    getDurationInMinutes(): number {
        const diffMs = this.endTime.getTime() - this.startTime.getTime()
        return Math.max(0, Math.floor(diffMs / (1000 * 60)))
    }

    /**
     * Thời lượng buổi học (giờ)
     */
    getDurationInHours(): number {
        return this.getDurationInMinutes() / 60
    }

    /**
     * Buổi học đã diễn ra chưa
     */
    isPast(): boolean {
        return this.getEndDateTime() < new Date()
    }

    /**
     * Buổi học đang diễn ra hôm nay
     */
    isToday(): boolean {
        const now = new Date()
        return (
            this.sessionDate.getDate() === now.getDate() &&
            this.sessionDate.getMonth() === now.getMonth() &&
            this.sessionDate.getFullYear() === now.getFullYear()
        )
    }

    /**
     * Buổi học sắp diễn ra
     */
    isUpcoming(): boolean {
        return this.getStartDateTime() > new Date()
    }

    /**
     * Trạng thái buổi học
     */
    getStatus(): 'past' | 'today' | 'upcoming' {
        if (this.isPast()) return 'past'
        if (this.isToday()) return 'today'
        return 'upcoming'
    }

    /**
     * Thời điểm bắt đầu (kết hợp date + time)
     */
    getStartDateTime(): Date {
        return new Date(
            this.sessionDate.getFullYear(),
            this.sessionDate.getMonth(),
            this.sessionDate.getDate(),
            this.startTime.getHours(),
            this.startTime.getMinutes(),
            this.startTime.getSeconds(),
        )
    }

    /**
     * Thời điểm kết thúc (kết hợp date + time)
     */
    getEndDateTime(): Date {
        return new Date(
            this.sessionDate.getFullYear(),
            this.sessionDate.getMonth(),
            this.sessionDate.getDate(),
            this.endTime.getHours(),
            this.endTime.getMinutes(),
            this.endTime.getSeconds(),
        )
    }

    /**
     * Tên hiển thị buổi học
     */
    getDisplayName(): string {
        if (this.name) return this.name
        if (this.courseClass) {
            return `${this.courseClass.className} - ${this.sessionDate.toLocaleDateString('vi-VN')}`
        }
        return `Session#${this.sessionId}`
    }

    equals(other: ClassSession): boolean {
        return this.sessionId === other.sessionId
    }

    toJSON() {
        return {
            sessionId: this.sessionId,
            classId: this.classId,
            name: this.name,
            sessionDate: this.sessionDate,
            startTime: this.startTime,
            endTime: this.endTime,
            makeupNote: this.makeupNote,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): ClassSession {
        return new ClassSession({
            sessionId: this.sessionId,
            classId: this.classId,
            name: this.name,
            sessionDate: this.sessionDate,
            startTime: this.startTime,
            endTime: this.endTime,
            makeupNote: this.makeupNote,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            courseClass: this.courseClass,
        })
    }
}
