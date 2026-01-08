// src/infrastructure/mappers/course.mapper.ts
import { Course, Subject, Admin } from '../../domain/entities'
import { AdminMapper } from './admin.mapper'

/**
 * Mapper class để convert từ Prisma Course models sang Domain Course entities
 */
export class CourseMapper {
    /**
     * Convert Prisma Course model sang Domain Course entity
     */
    static toDomainCourse(prismaCourse: any): Course | undefined {
        if (!prismaCourse) return undefined

        return new Course(
            prismaCourse.courseId,
            prismaCourse.title,
            prismaCourse.priceVND,
            prismaCourse.visibility,
            prismaCourse.isUpdatable,
            prismaCourse.createdAt,
            prismaCourse.updatedAt,
            prismaCourse.subtitle ?? undefined,
            prismaCourse.academicYear ?? undefined,
            prismaCourse.grade ?? undefined,
            prismaCourse.subjectId ?? undefined,
            prismaCourse.description ?? undefined,
            prismaCourse.compareAtVND ?? undefined,
            prismaCourse.teacherId ?? undefined,
            prismaCourse.subject ? this.toDomainSubject(prismaCourse.subject) : undefined,
            prismaCourse.teacher ? AdminMapper.toDomainAdmin(prismaCourse.teacher) : undefined,
        )
    }

    /**
     * Convert Prisma Subject model sang Domain Subject entity
     */
    static toDomainSubject(prismaSubject: any): Subject | undefined {
        if (!prismaSubject) return undefined

        return new Subject({
            subjectId: prismaSubject.subjectId,
            name: prismaSubject.name,
            code: prismaSubject.code ?? undefined
        })
    }

    /**
     * Convert array của Prisma Courses sang array của Domain Courses
     */
    static toDomainCourses(prismaCourses: any[]): Course[] {
        return prismaCourses
            .map((course) => this.toDomainCourse(course))
            .filter(Boolean) as Course[]
    }
}
