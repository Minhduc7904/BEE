// src/domain/entities/course/course-enrollment.entity.ts

import { Course } from '../course/course.entity'
import { Student } from '../user/student.entity'
import { CourseEnrollmentStatus } from 'src/shared/enums'

export class CourseEnrollment {
    // Required properties
    enrollmentId: number
    courseId: number
    studentId: number
    enrolledAt: Date
    status: CourseEnrollmentStatus
    createdAt: Date
    updatedAt: Date

    // Navigation properties
    course?: Course
    student?: Student

    constructor(data: {
        enrollmentId: number
        courseId: number
        studentId: number
        enrolledAt: Date
        status: CourseEnrollmentStatus
        createdAt?: Date
        updatedAt?: Date
        course?: Course
        student?: Student
    }) {
        this.enrollmentId = data.enrollmentId
        this.courseId = data.courseId
        this.studentId = data.studentId
        this.enrolledAt = data.enrolledAt
        this.status = data.status
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()
        this.course = data.course
        this.student = data.student
    }

    /* ===================== BUSINESS METHODS ===================== */

    /**
     * Đang học
     */
    isActive(): boolean {
        return this.status === CourseEnrollmentStatus.ACTIVE
    }

    /**
     * Đã hoàn thành
     */
    isCompleted(): boolean {
        return this.status === CourseEnrollmentStatus.COMPLETED
    }

    /**
     * Đã hủy
     */
    isCancelled(): boolean {
        return this.status === CourseEnrollmentStatus.CANCELLED
    }

    /**
     * Có thể hủy đăng ký không
     */
    canCancel(): boolean {
        return this.isActive()
    }

    /**
     * Có thể đánh dấu hoàn thành không
     */
    canComplete(): boolean {
        return this.isActive()
    }

    /**
     * Đánh dấu hoàn thành
     */
    markCompleted(): void {
        if (!this.canComplete()) {
            throw new Error('Enrollment cannot be completed')
        }
        this.status = CourseEnrollmentStatus.COMPLETED
        this.updatedAt = new Date()
    }

    /**
     * Hủy đăng ký
     */
    cancel(): void {
        if (!this.canCancel()) {
            throw new Error('Enrollment cannot be cancelled')
        }
        this.status = CourseEnrollmentStatus.CANCELLED
        this.updatedAt = new Date()
    }

    /**
     * Số ngày đã tham gia khóa học
     */
    getDaysEnrolled(): number {
        const diff = Date.now() - this.enrolledAt.getTime()
        return Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    /**
     * Trạng thái hiển thị
     */
    getStatusDisplay(): string {
        switch (this.status) {
            case CourseEnrollmentStatus.ACTIVE:
                return 'Đang học'
            case CourseEnrollmentStatus.COMPLETED:
                return 'Đã hoàn thành'
            case CourseEnrollmentStatus.CANCELLED:
                return 'Đã hủy'
            default:
                return this.status
        }
    }

    equals(other: CourseEnrollment): boolean {
        return this.enrollmentId === other.enrollmentId
    }

    toJSON() {
        return {
            enrollmentId: this.enrollmentId,
            courseId: this.courseId,
            studentId: this.studentId,
            enrolledAt: this.enrolledAt,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): CourseEnrollment {
        return new CourseEnrollment({
            enrollmentId: this.enrollmentId,
            courseId: this.courseId,
            studentId: this.studentId,
            enrolledAt: this.enrolledAt,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            course: this.course,
            student: this.student,
        })
    }
}
