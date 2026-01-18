// src/domain/entities/course/class-student.entity.ts

import { CourseClass } from '../course-class/course-class.entity'
import { Student } from '../user/student.entity'

export class ClassStudent {
    // Composite key
    classId: number
    studentId: number

    // State properties
    joinedAt?: Date
    createdAt: Date
    updatedAt: Date

    // Navigation properties
    courseClass?: CourseClass
    student?: Student

    constructor(data: {
        classId: number
        studentId: number
        joinedAt?: Date
        createdAt?: Date
        updatedAt?: Date
        courseClass?: CourseClass
        student?: Student
    }) {
        this.classId = data.classId
        this.studentId = data.studentId
        this.joinedAt = data.joinedAt
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()
        this.courseClass = data.courseClass
        this.student = data.student
    }

    /* ===================== DOMAIN METHODS ===================== */

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

    equals(other: ClassStudent): boolean {
        return (
            this.classId === other.classId &&
            this.studentId === other.studentId
        )
    }

    toJSON() {
        return {
            classId: this.classId,
            studentId: this.studentId,
            joinedAt: this.joinedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): ClassStudent {
        return new ClassStudent({
            classId: this.classId,
            studentId: this.studentId,
            joinedAt: this.joinedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            courseClass: this.courseClass,
            student: this.student,
        })
    }
}
