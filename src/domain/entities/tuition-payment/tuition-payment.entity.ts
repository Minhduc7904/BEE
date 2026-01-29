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
    amount: number // 💰 tiền phải đóng (snapshot)
    status: TuitionPaymentStatus
    createdAt: Date
    updatedAt: Date

    // =====================
    // Optional business fields
    // =====================
    courseId?: number | null
    month: number
    year: number 
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
        amount: number
        status: TuitionPaymentStatus

        courseId?: number | null
        month: number
        year: number 
        paidAt?: Date | null
        notes?: string | null

        createdAt?: Date
        updatedAt?: Date

        course?: Course | null
        student?: Student
    }) {
        this.paymentId = data.paymentId
        this.studentId = data.studentId
        this.amount = data.amount
        this.status = data.status

        this.courseId = data.courseId ?? null
        this.month = data.month 
        this.year = data.year 
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

    markPaid(at: Date = new Date(), notes?: string): void {
        this.status = TuitionPaymentStatus.PAID
        this.paidAt = at
        this.updatedAt = new Date()

        if (notes !== undefined) {
            this.notes = notes
        }
    }

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

    isOverdue(now: Date = new Date()): boolean {
        if (!this.hasPeriod()) return false
        if (this.isPaid()) return false

        // hạn: đầu tháng kế tiếp
        const dueDate = new Date(this.year!, this.month!, 1)
        return now > dueDate
    }

    getPeriodKey(): string | null {
        if (!this.hasPeriod()) return null
        return `${this.year}-${String(this.month).padStart(2, '0')}`
    }

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
            amount: this.amount,
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
            amount: this.amount,
            status: this.status,
            paidAt: this.paidAt,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }
}
