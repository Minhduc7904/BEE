// src/infrastructure/repositories/prisma-student.repository.ts
import { PrismaService } from '../../prisma/prisma.service';
import type { IStudentRepository, CreateStudentData } from '../../domain/repositories/student.repository';
import { Student } from '../../domain/entities/student.entity';
import { DomainMapper } from '../mappers/domain-mapper';

export class PrismaStudentRepository implements IStudentRepository {
    constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

    async create(data: CreateStudentData): Promise<Student> {
        const prismaStudent = await this.prisma.student.create({
            data: {
                userId: data.userId,
                studentPhone: data.studentPhone,
                parentPhone: data.parentPhone,
                grade: data.grade,
                school: data.school,
            },
        });

        return DomainMapper.toDomainStudent(prismaStudent)!;
    }

    async findById(id: number): Promise<Student | null> {
        const prismaStudent = await this.prisma.student.findUnique({
            where: { studentId: id },
            include: { user: true },
        });

        if (!prismaStudent) return null;

        return DomainMapper.toDomainStudent(prismaStudent)!;
    }

    async findByUserId(userId: number): Promise<Student | null> {
        const prismaStudent = await this.prisma.student.findUnique({
            where: { userId },
            include: { user: true },
        });

        if (!prismaStudent) return null;

        return DomainMapper.toDomainStudent(prismaStudent)!;
    }

    async update(id: number, data: Partial<Student>): Promise<Student> {
        const prismaStudent = await this.prisma.student.update({
            where: { studentId: id },
            data: {
                studentPhone: data.studentPhone,
                parentPhone: data.parentPhone,
                grade: data.grade,
                school: data.school,
            },
        });

        return DomainMapper.toDomainStudent(prismaStudent)!;
    }

    async delete(id: number): Promise<boolean> {
        try {
            await this.prisma.student.delete({
                where: { studentId: id },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async findByGrade(grade: number): Promise<Student[]> {
        const prismaStudents = await this.prisma.student.findMany({
            where: { grade },
            include: { user: true },
        });

        return DomainMapper.toDomainStudents(prismaStudents);
    }

    async findAll(): Promise<Student[]> {
        const prismaStudents = await this.prisma.student.findMany({
            include: { user: true },
        });

        return DomainMapper.toDomainStudents(prismaStudents);
    }
}
