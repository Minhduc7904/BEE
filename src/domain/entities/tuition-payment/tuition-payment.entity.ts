// src/domain/entities/course/tuition-payment.entity.ts

import { TuitionPaymentStatus } from '../../../shared/enums'
import { Course } from '../course/course.entity'
import { Student } from '../user/student.entity'

export class TuitionPayment {
    // =====================
    // Core properties
    // =====================
    paymentId: number
    studentId: number
    status: TuitionPaymentStatus
    createdAt: Date
    updatedAt: Date

    // =====================
    // Optional business fields
    // =====================
    courseId?: number | null
    month?: number | null // 1 - 12
    year?: number | null
    paidAt?: Date | null
    notes?: string | null

    // =====================
    // Navigation
    // =====================
    course?: Course | null
    student?: Student

    constructor(data: {
        paymentId: number
        studentId: number
        status: TuitionPaymentStatus

        courseId?: number | null
        month?: number | null
        year?: number | null
        paidAt?: Date | null
        notes?: string | null

        createdAt?: Date
        updatedAt?: Date

        course?: Course | null
        student?: Student
    }) {
        this.paymentId = data.paymentId
        this.studentId = data.studentId
        this.status = data.status

        this.courseId = data.courseId ?? null
        this.month = data.month ?? null
        this.year = data.year ?? null
        this.paidAt = data.paidAt ?? null
        this.notes = data.notes ?? null

        this.createdAt = data.createdAt ?? new Date()
        this.updatedAt = data.updatedAt ?? new Date()

        this.course = data.course ?? null
        this.student = data.student
    }

    // =====================
    // Domain state checks
    // =====================

    isPaid(): boolean {
        return this.status === TuitionPaymentStatus.PAID
    }

    isUnpaid(): boolean {
        return this.status === TuitionPaymentStatus.UNPAID
    }

    hasCourse(): boolean {
        return !!this.courseId
    }

    hasPeriod(): boolean {
        return this.month != null && this.year != null
    }

    // =====================
    // Domain actions
    // =====================

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
     * Reset về chưa thanh toán
     */
    markUnpaid(notes?: string): void {
        this.status = TuitionPaymentStatus.UNPAID
        this.paidAt = null
        this.updatedAt = new Date()

        if (notes !== undefined) {
            this.notes = notes
        }
    }

    // =====================
    // Business rules
    // =====================

    /**
     * Quá hạn thanh toán?
     * Chỉ check nếu CÓ month + year
     */
    isOverdue(now: Date = new Date()): boolean {
        if (!this.hasPeriod()) return false
        if (this.isPaid()) return false

        // Hạn: đầu tháng kế tiếp
        const dueDate = new Date(this.year!, this.month!, 1)
        return now > dueDate
    }

    /**
     * Chu kỳ học phí dạng YYYY-MM
     * null nếu không có chu kỳ
     */
    getPeriodKey(): string | null {
        if (!this.hasPeriod()) return null
        return `${this.year}-${String(this.month).padStart(2, '0')}`
    }

    /**
     * Label hiển thị
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

    // =====================
    // Equality & helpers
    // =====================

    equals(other: TuitionPayment): boolean {
        return this.paymentId === other.paymentId
    }

    clone(): TuitionPayment {
        return new TuitionPayment({
            paymentId: this.paymentId,
            studentId: this.studentId,
            status: this.status,

            courseId: this.courseId,
            month: this.month,
            year: this.year,
            paidAt: this.paidAt,
            notes: this.notes,

            createdAt: this.createdAt,
            updatedAt: this.updatedAt,

            course: this.course,
            student: this.student,
        })
    }

    toJSON() {
        return {
            paymentId: this.paymentId,
            studentId: this.studentId,
            courseId: this.courseId,
            month: this.month,
            year: this.year,
            status: this.status,
            paidAt: this.paidAt,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }
}
