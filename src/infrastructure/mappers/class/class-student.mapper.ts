// src/infrastructure/mappers/class-student.mapper.ts
import { ClassStudent } from '../../../domain/entities/class-student/class-student.entity'
import { CourseClassMapper } from './course-class.mapper'
import { StudentMapper } from '../user/student.mapper'

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

        return new ClassStudent({
            classId: prismaClassStudent.classId,
            studentId: prismaClassStudent.studentId,
            joinedAt: prismaClassStudent.joinedAt ?? undefined,
            createdAt: prismaClassStudent.createdAt ?? undefined,
            updatedAt: prismaClassStudent.updatedAt ?? undefined,
            courseClass: prismaClassStudent.courseClass
                ? CourseClassMapper.toDomainCourseClass(prismaClassStudent.courseClass)
                : undefined,
            student: prismaClassStudent.student
                ? StudentMapper.toDomainStudent(prismaClassStudent.student)
                : undefined,
        })
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
