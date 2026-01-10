// src/domain/entities/course/course-enrollment.entity.ts
import { Course } from '../course/course.entity'
import { Student } from '../user/student.entity'
import { CourseEnrollmentStatus } from '@prisma/client'


export class CourseEnrollment {
    enrollmentId: number
    courseId: number
    studentId: number
    enrolledAt: Date
    status: CourseEnrollmentStatus
    createdAt?: Date
    updatedAt?: Date

    // Relations
    course?: Course
    student?: Student

    constructor(
        enrollmentId: number,
        courseId: number,
        studentId: number,
        enrolledAt: Date,
        status: CourseEnrollmentStatus,
        createdAt?: Date,
        updatedAt?: Date,
        course?: Course,
        student?: Student,
    ) {
        this.enrollmentId = enrollmentId
        this.courseId = courseId
        this.studentId = studentId
        this.enrolledAt = enrolledAt
        this.status = status
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.course = course
        this.student = student
    }

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
    }

    /**
     * Hủy đăng ký
     */
    cancel(): void {
        if (!this.canCancel()) {
            throw new Error('Enrollment cannot be cancelled')
        }
        this.status = CourseEnrollmentStatus.CANCELLED
    }

    /**
     * Số ngày đã tham gia khóa học
     */
    getDaysEnrolled(): number {
        const now = new Date()
        const diff = now.getTime() - this.enrolledAt.getTime()
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
}
