// src/domain/entities/course/tuition-payment.entity.ts

import { TuitionPaymentStatus } from '../../../shared/enums'
import { Course } from '../course/course.entity'
import { Student } from '../user/student.entity'

export class TuitionPayment {
    // Required properties
    paymentId: number
    courseId: number
    studentId: number
    month: number // 1 - 12
    year: number
    status: TuitionPaymentStatus
    createdAt: Date
    updatedAt: Date

    // Optional properties
    paidAt?: Date | null
    notes?: string | null

    // Navigation properties
    course?: Course
    student?: Student

    constructor(data: {
        paymentId: number
        courseId: number
        studentId: number
        month: number
        year: number
        status: TuitionPaymentStatus
        createdAt?: Date
        updatedAt?: Date
        paidAt?: Date | null
        notes?: string | null
        course?: Course
        student?: Student
    }) {
        this.paymentId = data.paymentId
        this.courseId = data.courseId
        this.studentId = data.studentId
        this.month = data.month
        this.year = data.year
        this.status = data.status
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()

        this.paidAt = data.paidAt
        this.notes = data.notes
        this.course = data.course
        this.student = data.student
    }

    /* ===================== DOMAIN METHODS ===================== */

    isPaid(): boolean {
        return this.status === TuitionPaymentStatus.PAID
    }

    isUnpaid(): boolean {
        return this.status === TuitionPaymentStatus.UNPAID
    }

    /**
     * Đánh dấu đã thanh toán
     */
    markPaid(at: Date = new Date(), notes?: string): void {
        this.status = TuitionPaymentStatus.PAID
        this.paidAt = at
        this.updatedAt = new Date()

        if (notes !== undefined) {
            this.notes = notes
        }
    }

    /**
     * Reset về chưa thanh toán (hoàn tiền / nhập sai)
     */
    markUnpaid(notes?: string): void {
        this.status = TuitionPaymentStatus.UNPAID
        this.paidAt = null
        this.updatedAt = new Date()

        if (notes !== undefined) {
            this.notes = notes
        }
    }

    /**
     * Kiểm tra có quá hạn thanh toán không
     * (rule cụ thể sẽ do Course quyết định grace period)
     */
    isOverdue(now: Date = new Date()): boolean {
        const dueDate = new Date(this.year, this.month, 1) // đầu tháng kế tiếp
        return this.isUnpaid() && now > dueDate
    }

    /**
     * Lấy label hiển thị
     */
    getStatusLabel(): string {
        switch (this.status) {
            case TuitionPaymentStatus.PAID:
                return 'Đã đóng'
            case TuitionPaymentStatus.UNPAID:
                return 'Chưa đóng'
            default:
                return 'Không xác định'
        }
    }

    /**
     * Chu kỳ học phí dạng YYYY-MM
     */
    getPeriodKey(): string {
        return `${this.year}-${String(this.month).padStart(2, '0')}`
    }

    equals(other: TuitionPayment): boolean {
        return this.paymentId === other.paymentId
    }

    toJSON() {
        return {
            paymentId: this.paymentId,
            courseId: this.courseId,
            studentId: this.studentId,
            month: this.month,
            year: this.year,
            status: this.status,
            paidAt: this.paidAt,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): TuitionPayment {
        return new TuitionPayment({
            paymentId: this.paymentId,
            courseId: this.courseId,
            studentId: this.studentId,
            month: this.month,
            year: this.year,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            paidAt: this.paidAt,
            notes: this.notes,
            course: this.course,
            student: this.student,
        })
    }
}
