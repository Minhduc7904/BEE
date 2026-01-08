// src/domain/entities/course/class-student.entity.ts
import { CourseClass } from '../course-class/course-class.entity'
import { Student } from '../user/student.entity'

export class ClassStudent {
    classId: number
    studentId: number
    joinedAt?: Date
    createdAt?: Date
    updatedAt?: Date

    // Relations
    courseClass?: CourseClass
    student?: Student

    constructor(
        classId: number,
        studentId: number,
        joinedAt?: Date,
        createdAt?: Date,
        updatedAt?: Date,
        courseClass?: CourseClass,
        student?: Student,
    ) {
        this.classId = classId
        this.studentId = studentId
        this.joinedAt = joinedAt
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.courseClass = courseClass
        this.student = student
    }

    /**
     * Quan hệ lớp – học sinh hợp lệ
     */
    isValid(): boolean {
        return this.classId > 0 && this.studentId > 0
    }

    /**
     * Học sinh có thuộc lớp không
     */
    isEnrolled(): boolean {
        return this.isValid()
    }

    /**
     * Lấy tên hiển thị (domain-friendly)
     * Không phụ thuộc DTO / UI
     */
    getDisplayName(): string {
        if (this.student && this.courseClass) {
            return `${this.student.getFullName()} - ${this.courseClass.className}`
        }

        if (this.student) {
            return this.student.getFullName()
        }

        return `Student#${this.studentId} - Class#${this.classId}`
    }
}
