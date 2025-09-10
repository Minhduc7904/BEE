// src/infrastructure/mappers/student.mapper.ts
import { Student } from '../../domain/entities/user/student.entity';

/**
 * Mapper class để convert từ Prisma Student models sang Domain Student entities
 */
export class StudentMapper {
    /**
     * Convert Prisma Student model sang Domain Student entity
     */
    static toDomainStudent(prismaStudent: any): Student | undefined {
        if (!prismaStudent) return undefined;

        return new Student(
            prismaStudent.studentId,
            prismaStudent.userId,
            prismaStudent.grade,
            prismaStudent.studentPhone ?? undefined,
            prismaStudent.parentPhone ?? undefined,
            prismaStudent.school ?? undefined
        );
    }

    /**
     * Convert array của Prisma Students sang array của Domain Students
     */
    static toDomainStudents(prismaStudents: any[]): Student[] {
        return prismaStudents.map(student => this.toDomainStudent(student)).filter(Boolean) as Student[];
    }
}
