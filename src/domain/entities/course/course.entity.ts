// src/domain/entities/course/course.entity.ts

import { CourseVisibility, PaymentType } from '../../../shared/enums'
import { Subject } from '../subject/subject.entity'
import { Admin } from '../user/admin.entity'
import { Lesson } from '../lesson/lesson.entity'
import { CourseClass } from '../course-class'
import { CourseEnrollment } from '../course-enrollment'
import { TuitionPayment } from '../tuition-payment'

export class Course {
    // Required properties
    courseId: number
    title: string
    priceVND: number
    visibility: CourseVisibility
    hasTuitionFee: boolean
    paymentType: PaymentType
    autoRenew: boolean
    blockUnpaid: boolean
    createdAt: Date
    updatedAt: Date

    // Optional properties
    subtitle?: string | null
    academicYear?: string | null
    grade?: number | null
    subjectId?: number | null
    description?: string | null
    compareAtVND?: number | null
    teacherId?: number | null
    gracePeriodDays?: number | null

    // Navigation properties
    subject?: Subject | null
    teacher?: Admin | null
    lessons?: Lesson[]
    courseClasses?: CourseClass[]
    courseEnrollments?: CourseEnrollment[]
    tuitionPayments?: TuitionPayment[]

    constructor(data: {
        courseId: number
        title: string
        priceVND: number
        visibility: CourseVisibility
        hasTuitionFee: boolean
        paymentType: PaymentType
        autoRenew: boolean
        blockUnpaid: boolean
        createdAt?: Date
        updatedAt?: Date
        subtitle?: string | null
        academicYear?: string | null
        grade?: number | null
        subjectId?: number | null
        description?: string | null
        compareAtVND?: number | null
        teacherId?: number | null
        gracePeriodDays?: number | null
        subject?: Subject | null
        teacher?: Admin | null
        lessons?: Lesson[]
        courseClasses?: CourseClass[]
        courseEnrollments?: CourseEnrollment[]
        tuitionPayments?: TuitionPayment[]
    }) {
        this.courseId = data.courseId
        this.title = data.title
        this.priceVND = data.priceVND
        this.visibility = data.visibility
        this.hasTuitionFee = data.hasTuitionFee
        this.paymentType = data.paymentType
        this.autoRenew = data.autoRenew
        this.blockUnpaid = data.blockUnpaid
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()

        this.subtitle = data.subtitle
        this.academicYear = data.academicYear
        this.grade = data.grade
        this.subjectId = data.subjectId
        this.description = data.description
        this.compareAtVND = data.compareAtVND
        this.teacherId = data.teacherId
        this.gracePeriodDays = data.gracePeriodDays

        this.subject = data.subject
        this.teacher = data.teacher
        this.lessons = data.lessons
        this.courseClasses = data.courseClasses
        this.courseEnrollments = data.courseEnrollments
        this.tuitionPayments = data.tuitionPayments
    }

    /* ===================== BUSINESS METHODS ===================== */

    isDraft(): boolean {
        return this.visibility === CourseVisibility.DRAFT
    }

    isPublished(): boolean {
        return this.visibility === CourseVisibility.PUBLISHED
    }

    isPrivate(): boolean {
        return this.visibility === CourseVisibility.PRIVATE
    }

    canUpdate(): boolean {
        return true
    }

    isFree(): boolean {
        return this.priceVND === 0 || this.hasTuitionFee === false
    }

    hasDiscount(): boolean {
        return (
            this.compareAtVND !== null &&
            this.compareAtVND !== undefined &&
            this.compareAtVND > this.priceVND
        )
    }

    getDiscountPercentage(): number {
        if (!this.hasDiscount()) return 0
        return Math.round(
            ((this.compareAtVND! - this.priceVND) / this.compareAtVND!) * 100,
        )
    }

    getDisplayTitle(): string {
        return this.subtitle ? `${this.title} - ${this.subtitle}` : this.title
    }

    getPriceDisplay(): string {
        if (this.isFree()) return 'Miễn phí'
        return `${this.priceVND.toLocaleString('vi-VN')} VNĐ`
    }

    /**
     * Có chặn học nếu chưa thanh toán không
     */
    shouldBlockWhenUnpaid(): boolean {
        return this.hasTuitionFee && this.blockUnpaid
    }

    /**
     * Có ân hạn không
     */
    hasGracePeriod(): boolean {
        return this.gracePeriodDays !== null && this.gracePeriodDays !== undefined
    }

    equals(other: Course): boolean {
        return this.courseId === other.courseId
    }

    toJSON() {
        return {
            courseId: this.courseId,
            title: this.title,
            subtitle: this.subtitle,
            academicYear: this.academicYear,
            grade: this.grade,
            subjectId: this.subjectId,
            description: this.description,
            priceVND: this.priceVND,
            compareAtVND: this.compareAtVND,
            visibility: this.visibility,
            teacherId: this.teacherId,
            hasTuitionFee: this.hasTuitionFee,
            paymentType: this.paymentType,
            autoRenew: this.autoRenew,
            blockUnpaid: this.blockUnpaid,
            gracePeriodDays: this.gracePeriodDays,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): Course {
        return new Course({
            courseId: this.courseId,
            title: this.title,
            priceVND: this.priceVND,
            visibility: this.visibility,
            hasTuitionFee: this.hasTuitionFee,
            paymentType: this.paymentType,
            autoRenew: this.autoRenew,
            blockUnpaid: this.blockUnpaid,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            subtitle: this.subtitle,
            academicYear: this.academicYear,
            grade: this.grade,
            subjectId: this.subjectId,
            description: this.description,
            compareAtVND: this.compareAtVND,
            teacherId: this.teacherId,
            gracePeriodDays: this.gracePeriodDays,
            subject: this.subject,
            teacher: this.teacher,
            lessons: this.lessons,
            courseClasses: this.courseClasses,
            courseEnrollments: this.courseEnrollments,
            tuitionPayments: this.tuitionPayments,
        })
    }
}
