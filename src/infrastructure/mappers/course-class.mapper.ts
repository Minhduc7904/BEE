// src/infrastructure/mappers/course-class.mapper.ts
import { CourseClass } from 'src/domain/entities/course-class/course-class.entity'
import { CourseMapper } from './course.mapper'
import { AdminMapper } from './admin.mapper'

/**
 * Mapper class để convert từ Prisma CourseClass model
 * sang Domain CourseClass entity
 */
export class CourseClassMapper {
    /**
     * Convert Prisma CourseClass sang Domain CourseClass
     */
    static toDomainCourseClass(prismaClass: any): CourseClass | undefined {
        if (!prismaClass) return undefined

        return new CourseClass(
            prismaClass.classId,
            prismaClass.courseId,
            prismaClass.className,
            prismaClass.createdAt ?? undefined,
            prismaClass.updatedAt ?? undefined,
            prismaClass.startDate ?? undefined,
            prismaClass.endDate ?? undefined,
            prismaClass.room ?? undefined,
            prismaClass.instructorId ?? undefined,
            prismaClass.course
                ? CourseMapper.toDomainCourse(prismaClass.course)
                : undefined,
            prismaClass.instructor
                ? AdminMapper.toDomainAdmin(prismaClass.instructor)
                : undefined,
        )
    }

    /**
     * Convert array Prisma CourseClasses sang array Domain CourseClasses
     */
    static toDomainCourseClasses(prismaClasses: any[]): CourseClass[] {
        return prismaClasses
            .map((courseClass) => this.toDomainCourseClass(courseClass))
            .filter(Boolean) as CourseClass[]
    }
}
