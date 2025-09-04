// src/domain/repositories/student.repository.ts
import { Student } from '../entities/user/student.entity';

export interface CreateStudentData {
    userId: number;
    studentPhone?: string;
    parentPhone?: string;
    grade: number;
    school?: string;
}

export interface IStudentRepository {
    create(data: CreateStudentData): Promise<Student>;
    findById(id: number): Promise<Student | null>;
    findByUserId(userId: number): Promise<Student | null>;
    update(id: number, data: Partial<Student>): Promise<Student>;
    delete(id: number): Promise<boolean>;
    findByGrade(grade: number): Promise<Student[]>;
    findAll(): Promise<Student[]>;
}
