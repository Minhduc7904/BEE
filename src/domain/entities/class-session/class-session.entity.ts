// src/domain/entities/course/class-session.entity.ts
import { CourseClass } from '../course-class/course-class.entity'

export class ClassSession {
    sessionId: number
    classId: number
    sessionDate: Date
    startTime: Date
    endTime: Date
    createdAt?: Date
    updatedAt?: Date

    // Relations
    courseClass?: CourseClass

    constructor(
        sessionId: number,
        classId: number,
        sessionDate: Date,
        startTime: Date,
        endTime: Date,
        createdAt?: Date,
        updatedAt?: Date,
        courseClass?: CourseClass,
    ) {
        this.sessionId = sessionId
        this.classId = classId
        this.sessionDate = sessionDate
        this.startTime = startTime
        this.endTime = endTime
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.courseClass = courseClass
    }

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
        const now = new Date()
        return this.getEndDateTime() < now
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
        const now = new Date()
        return this.getStartDateTime() > now
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
        if (this.courseClass) {
            return `${this.courseClass.className} - ${this.sessionDate.toLocaleDateString('vi-VN')}`
        }
        return `Session#${this.sessionId}`
    }
}
