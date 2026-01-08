// src/infrastructure/mappers/course-enrollment.mapper.ts
import { CourseEnrollment, EnrollmentStatus } from 'src/domain/entities/course-enrollment/course-enrollment.entity'
import { CourseMapper } from './course.mapper'
import { StudentMapper } from './student.mapper'

/**
 * Mapper class để convert từ Prisma CourseEnrollment model
 * sang Domain CourseEnrollment entity
 */
export class CourseEnrollmentMapper {
    /**
     * Convert Prisma CourseEnrollment sang Domain CourseEnrollment
     */
    static toDomainCourseEnrollment(prismaEnrollment: any): CourseEnrollment | undefined {
        if (!prismaEnrollment) return undefined

        return new CourseEnrollment(
            prismaEnrollment.enrollmentId,
            prismaEnrollment.courseId,
            prismaEnrollment.studentId,
            prismaEnrollment.enrolledAt,
            prismaEnrollment.status as EnrollmentStatus,
            prismaEnrollment.createdAt ?? undefined,
            prismaEnrollment.updatedAt ?? undefined,
            prismaEnrollment.course
                ? CourseMapper.toDomainCourse(prismaEnrollment.course)
                : undefined,
            prismaEnrollment.student
                ? StudentMapper.toDomainStudent(prismaEnrollment.student)
                : undefined,
        )
    }

    /**
     * Convert array Prisma CourseEnrollments sang array Domain CourseEnrollments
     */
    static toDomainCourseEnrollments(prismaEnrollments: any[]): CourseEnrollment[] {
        return prismaEnrollments
            .map((enrollment) => this.toDomainCourseEnrollment(enrollment))
            .filter(Boolean) as CourseEnrollment[]
    }
}
