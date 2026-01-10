// src/domain/entities/course/course-class.entity.ts
import { Course } from '../course/course.entity'
import { Admin } from '../user/admin.entity'

export class CourseClass {
    classId: number
    courseId: number
    className: string
    startDate?: Date
    endDate?: Date
    room?: string
    instructorId?: number
    createdAt?: Date
    updatedAt?: Date

    // Relations
    course?: Course
    instructor?: Admin

    constructor(
        classId: number,
        courseId: number,
        className: string,
        createdAt?: Date,
        updatedAt?: Date,
        startDate?: Date,
        endDate?: Date,
        room?: string,
        instructorId?: number,
        course?: Course,
        instructor?: Admin,
    ) {
        this.classId = classId
        this.courseId = courseId
        this.className = className
        this.startDate = startDate
        this.endDate = endDate
        this.room = room
        this.instructorId = instructorId
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.course = course
        this.instructor = instructor
    }

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
        return !!this.instructorId
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
}
