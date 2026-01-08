// src/infrastructure/mappers/class-student.mapper.ts
import { ClassStudent } from '../../domain/entities/class-student/class-student.entity'
import { CourseClassMapper } from './course-class.mapper'
import { StudentMapper } from './student.mapper'

/**
 * Mapper class để convert từ Prisma ClassStudent model
 * sang Domain ClassStudent entity
 */
export class ClassStudentMapper {
    /**
     * Convert Prisma ClassStudent sang Domain ClassStudent
     */
    static toDomainClassStudent(prismaClassStudent: any): ClassStudent | undefined {
        if (!prismaClassStudent) return undefined

        return new ClassStudent(
            prismaClassStudent.classId,
            prismaClassStudent.studentId,
            prismaClassStudent.joinedAt ?? undefined,
            prismaClassStudent.createdAt ?? undefined,
            prismaClassStudent.updatedAt ?? undefined,
            prismaClassStudent.courseClass
                ? CourseClassMapper.toDomainCourseClass(prismaClassStudent.courseClass)
                : undefined,
            prismaClassStudent.student
                ? StudentMapper.toDomainStudent(prismaClassStudent.student)
                : undefined,
        )
    }

    /**
     * Convert array Prisma ClassStudents sang array Domain ClassStudents
     */
    static toDomainClassStudents(prismaClassStudents: any[]): ClassStudent[] {
        return prismaClassStudents
            .map((cs) => this.toDomainClassStudent(cs))
            .filter(Boolean) as ClassStudent[]
    }
}
