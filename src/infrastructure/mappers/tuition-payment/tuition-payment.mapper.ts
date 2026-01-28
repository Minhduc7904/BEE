// src/infrastructure/mappers/tuition-payment.mapper.ts

import { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import { Course } from '../../../domain/entities/course/course.entity'
import { Student } from '../../../domain/entities/user/student.entity'
import { TuitionPaymentStatus } from '../../../shared/enums'
import { CourseMapper } from '../course/course.mapper'
import { StudentMapper } from '../user/student.mapper'

/**
 * Mapper class để convert từ Prisma TuitionPayment model
 * sang Domain TuitionPayment entity
 */
export class TuitionPaymentMapper {
    /**
     * Convert Prisma TuitionPayment sang Domain TuitionPayment
     */
    static toDomainTuitionPayment(
        prismaPayment: any,
    ): TuitionPayment | undefined {
        if (!prismaPayment) return undefined

        return new TuitionPayment({
            paymentId: prismaPayment.paymentId,
            studentId: prismaPayment.studentId,
            status: prismaPayment.status as TuitionPaymentStatus,

            courseId: prismaPayment.courseId ?? null,
            month: prismaPayment.month ?? null,
            year: prismaPayment.year ?? null,

            paidAt: prismaPayment.paidAt ?? null,
            notes: prismaPayment.notes ?? null,

            createdAt: prismaPayment.createdAt,
            updatedAt: prismaPayment.updatedAt,

            course: prismaPayment.course
                ? CourseMapper.toDomainCourse(prismaPayment.course)
                : null,

            student: prismaPayment.student
                ? StudentMapper.toDomainStudent(prismaPayment.student)
                : undefined,
        })
    }

    /**
     * Convert array Prisma TuitionPayments sang Domain TuitionPayments
     */
    static toDomainTuitionPayments(
        prismaPayments: any[] | null | undefined,
    ): TuitionPayment[] {
        if (!prismaPayments || prismaPayments.length === 0) return []

        return prismaPayments
            .map((payment) => this.toDomainTuitionPayment(payment))
            .filter(Boolean) as TuitionPayment[]
    }
}
