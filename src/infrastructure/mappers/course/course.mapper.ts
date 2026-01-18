// src/infrastructure/mappers/course.mapper.ts

import { Course } from '../../../domain/entities/course/course.entity'
import { Subject } from '../../../domain/entities/subject/subject.entity'
import { AdminMapper } from '../user/admin.mapper'

/**
 * Mapper class để convert từ Prisma Course model
 * sang Domain Course entity
 */
export class CourseMapper {
    /**
     * Convert Prisma Course sang Domain Course
     */
    static toDomainCourse(prismaCourse: any): Course | undefined {
        if (!prismaCourse) return undefined

        return new Course({
            courseId: prismaCourse.courseId,
            title: prismaCourse.title,
            priceVND: prismaCourse.priceVND,
            visibility: prismaCourse.visibility,
            isUpdatable: prismaCourse.isUpdatable,
            hasTuitionFee: prismaCourse.hasTuitionFee ?? true,
            paymentType: prismaCourse.paymentType,
            autoRenew: prismaCourse.autoRenew ?? false,
            blockUnpaid: prismaCourse.blockUnpaid ?? false,

            createdAt: prismaCourse.createdAt,
            updatedAt: prismaCourse.updatedAt,

            subtitle: prismaCourse.subtitle ?? null,
            academicYear: prismaCourse.academicYear ?? null,
            grade: prismaCourse.grade ?? null,
            subjectId: prismaCourse.subjectId ?? null,
            description: prismaCourse.description ?? null,
            compareAtVND: prismaCourse.compareAtVND ?? null,
            teacherId: prismaCourse.teacherId ?? null,
            gracePeriodDays: prismaCourse.gracePeriodDays ?? null,

            subject: prismaCourse.subject
                ? this.toDomainSubject(prismaCourse.subject)
                : null,

            teacher: prismaCourse.teacher
                ? AdminMapper.toDomainAdmin(prismaCourse.teacher)
                : null,
        })
    }

    /**
     * Convert Prisma Subject sang Domain Subject
     */
    static toDomainSubject(prismaSubject: any): Subject | undefined {
        if (!prismaSubject) return undefined

        return new Subject({
            subjectId: prismaSubject.subjectId,
            name: prismaSubject.name,
            code: prismaSubject.code ?? undefined,
        })
    }

    /**
     * Convert array Prisma Courses sang Domain Courses
     */
    static toDomainCourses(prismaCourses: any[] | null | undefined): Course[] {
        if (!prismaCourses || prismaCourses.length === 0) return []

        return prismaCourses
            .map((course) => this.toDomainCourse(course))
            .filter(Boolean) as Course[]
    }
}
