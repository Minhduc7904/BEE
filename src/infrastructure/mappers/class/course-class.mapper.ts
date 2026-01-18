// src/infrastructure/mappers/course-class.mapper.ts
import { CourseClass } from 'src/domain/entities/course-class/course-class.entity'
import { CourseMapper } from '../course/course.mapper'
import { AdminMapper } from '../user/admin.mapper'

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

        return new CourseClass({
            classId: prismaClass.classId,
            courseId: prismaClass.courseId,
            className: prismaClass.className,
            createdAt: prismaClass.createdAt ?? undefined,
            updatedAt: prismaClass.updatedAt ?? undefined,
            startDate: prismaClass.startDate ?? undefined,
            endDate: prismaClass.endDate ?? undefined,
            room: prismaClass.room ?? undefined,
            instructorId: prismaClass.instructorId ?? undefined,
            course: prismaClass.course
                ? CourseMapper.toDomainCourse(prismaClass.course)
                : undefined,
            instructor: prismaClass.instructor
                ? AdminMapper.toDomainAdmin(prismaClass.instructor)
                : undefined,
        })
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
