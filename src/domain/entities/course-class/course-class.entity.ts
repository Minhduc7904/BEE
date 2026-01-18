// src/domain/entities/course/course-class.entity.ts

import { Course } from '../course/course.entity'
import { Admin } from '../user/admin.entity'

export class CourseClass {
    // Required properties
    classId: number
    courseId: number
    className: string
    createdAt: Date
    updatedAt: Date

    // Optional properties
    startDate?: Date
    endDate?: Date
    room?: string
    instructorId?: number

    // Navigation properties
    course?: Course
    instructor?: Admin

    constructor(data: {
        classId: number
        courseId: number
        className: string
        createdAt?: Date
        updatedAt?: Date
        startDate?: Date
        endDate?: Date
        room?: string
        instructorId?: number
        course?: Course
        instructor?: Admin
    }) {
        this.classId = data.classId
        this.courseId = data.courseId
        this.className = data.className
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()

        this.startDate = data.startDate
        this.endDate = data.endDate
        this.room = data.room
        this.instructorId = data.instructorId

        this.course = data.course
        this.instructor = data.instructor
    }

    /* ===================== BUSINESS METHODS ===================== */

    /**
     * Lớp đã được lên lịch chưa
     */
    isScheduled(): boolean {
        return !!this.startDate
    }

    /**
     * Lớp đang diễn ra
     */
    isActive(): boolean {
        if (!this.startDate) return false
        const now = new Date()

        if (!this.endDate) {
            return this.startDate <= now
        }

        return this.startDate <= now && now <= this.endDate
    }

    /**
     * Lớp đã kết thúc
     */
    isCompleted(): boolean {
        if (!this.endDate) return false
        return new Date() > this.endDate
    }

    /**
     * Lớp sắp diễn ra
     */
    isUpcoming(): boolean {
        if (!this.startDate) return false
        return new Date() < this.startDate
    }

    /**
     * Có giáo viên phụ trách không
     */
    hasInstructor(): boolean {
        return this.instructorId !== null && this.instructorId !== undefined
    }

    /**
     * Số ngày diễn ra của lớp
     */
    getDurationInDays(): number | null {
        if (!this.startDate || !this.endDate) return null
        const diff = this.endDate.getTime() - this.startDate.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    /**
     * Trạng thái hiển thị của lớp
     */
    getStatus(): 'unscheduled' | 'upcoming' | 'active' | 'completed' {
        if (!this.isScheduled()) return 'unscheduled'
        if (this.isCompleted()) return 'completed'
        if (this.isActive()) return 'active'
        if (this.isUpcoming()) return 'upcoming'
        return 'unscheduled'
    }

    /**
     * Tên hiển thị lớp
     */
    getDisplayName(): string {
        if (this.course) {
            return `${this.course.title} - ${this.className}`
        }
        return this.className
    }

    equals(other: CourseClass): boolean {
        return this.classId === other.classId
    }

    toJSON() {
        return {
            classId: this.classId,
            courseId: this.courseId,
            className: this.className,
            startDate: this.startDate,
            endDate: this.endDate,
            room: this.room,
            instructorId: this.instructorId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): CourseClass {
        return new CourseClass({
            classId: this.classId,
            courseId: this.courseId,
            className: this.className,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            startDate: this.startDate,
            endDate: this.endDate,
            room: this.room,
            instructorId: this.instructorId,
            course: this.course,
            instructor: this.instructor,
        })
    }
}
