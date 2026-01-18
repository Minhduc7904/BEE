// src/infrastructure/mappers/course-enrollment.mapper.ts
import { CourseEnrollment } from 'src/domain/entities/course-enrollment/course-enrollment.entity'
import { CourseMapper } from './course.mapper'
import { StudentMapper } from '../user/student.mapper'
import { CourseEnrollmentStatus } from 'src/shared/enums'
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

        return new CourseEnrollment({
            enrollmentId: prismaEnrollment.enrollmentId,
            courseId: prismaEnrollment.courseId,
            studentId: prismaEnrollment.studentId,
            enrolledAt: prismaEnrollment.enrolledAt,
            status: prismaEnrollment.status as CourseEnrollmentStatus,
            createdAt: prismaEnrollment.createdAt ?? undefined,
            updatedAt: prismaEnrollment.updatedAt ?? undefined,
            course: prismaEnrollment.course
                ? CourseMapper.toDomainCourse(prismaEnrollment.course)
                : undefined,
            student: prismaEnrollment.student
                ? StudentMapper.toDomainStudent(prismaEnrollment.student)
                : undefined,
        })
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
