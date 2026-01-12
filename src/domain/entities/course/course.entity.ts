// src/domain/entities/course/course.entity.ts
import { Subject } from '../subject/subject.entity'
import { Admin } from '../user/admin.entity'
import { Visibility } from '../../../shared/enums'

export class Course {
    courseId: number
    title: string
    subtitle?: string
    academicYear?: string
    grade?: number
    subjectId?: number
    description?: string
    priceVND: number
    compareAtVND?: number
    visibility: Visibility
    teacherId?: number
    isUpdatable: boolean
    createdAt: Date
    updatedAt: Date

    // Relations
    subject?: Subject
    teacher?: Admin

    constructor(
        courseId: number,
        title: string,
        priceVND: number,
        visibility: Visibility,
        isUpdatable: boolean,
        createdAt: Date,
        updatedAt: Date,
        subtitle?: string,
        academicYear?: string,
        grade?: number,
        subjectId?: number,
        description?: string,
        compareAtVND?: number,
        teacherId?: number,
        subject?: Subject,
        teacher?: Admin,
    ) {
        this.courseId = courseId
        this.title = title
        this.subtitle = subtitle
        this.academicYear = academicYear
        this.grade = grade
        this.subjectId = subjectId
        this.description = description
        this.priceVND = priceVND
        this.compareAtVND = compareAtVND
        this.visibility = visibility
        this.teacherId = teacherId
        this.isUpdatable = isUpdatable
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.subject = subject
        this.teacher = teacher
    }

    /**
     * Kiểm tra khóa học có đang trong trạng thái draft không
     */
    isDraft(): boolean {
        return this.visibility === 'DRAFT'
    }

    /**
     * Kiểm tra khóa học có đang public không
     */
    isPublished(): boolean {
        return this.visibility === 'PUBLISHED'
    }

    /**
     * Kiểm tra khóa học có đang bị archive không
     */
    isPrivate(): boolean {
        return this.visibility === 'PRIVATE'
    }

    /**
     * Kiểm tra khóa học có thể chỉnh sửa không
     */
    canUpdate(): boolean {
        return this.isUpdatable
    }

    /**
     * Kiểm tra khóa học có giảm giá không
     */
    hasDiscount(): boolean {
        return !!this.compareAtVND && this.compareAtVND > this.priceVND
    }

    /**
     * Tính phần trăm giảm giá
     */
    getDiscountPercentage(): number {
        if (!this.hasDiscount()) return 0
        return Math.round(((this.compareAtVND! - this.priceVND) / this.compareAtVND!) * 100)
    }

    /**
     * Lấy tên hiển thị khóa học
     */
    getDisplayTitle(): string {
        if (this.subtitle) {
            return `${this.title} - ${this.subtitle}`
        }
        return this.title
    }

    /**
     * Lấy thông tin giá hiển thị
     */
    getPriceDisplay(): string {
        if (this.priceVND === 0) {
            return 'Miễn phí'
        }
        return `${this.priceVND.toLocaleString('vi-VN')} VNĐ`
    }

    /**
     * Kiểm tra khóa học có miễn phí không
     */
    isFree(): boolean {
        return this.priceVND === 0
    }
}
