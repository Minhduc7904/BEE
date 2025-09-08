// src/domain/repositories/student.repository.ts
import { Student } from '../entities/user/student.entity';

export interface CreateStudentData {
    userId: number;
    studentPhone?: string;
    parentPhone?: string;
    grade: number;
    school?: string;
}

export interface StudentFilterOptions {
    // Student fields
    grade?: number;
    school?: string;
    studentPhone?: string;
    parentPhone?: string;
    
    // User fields (từ relation)
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    
    // Date range filters
    createdAfter?: Date;
    createdBefore?: Date;
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
    
    // Search across multiple fields
    search?: string; // Tìm kiếm trong username, email, firstName, lastName, school
}

export interface StudentSortOptions {
    field: 'studentId' | 'userId' | 'grade' | 'school' | 'username' | 'email' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'lastLoginAt';
    direction: 'asc' | 'desc';
}

export interface StudentPaginationOptions {
    page: number;
    limit: number;
    sortBy?: StudentSortOptions;
}

export interface StudentListResult {
    data: Student[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface IStudentRepository {
    create(data: CreateStudentData): Promise<Student>;
    findById(id: number): Promise<Student | null>;
    findByUserId(userId: number): Promise<Student | null>;
    update(id: number, data: Partial<Student>): Promise<Student>;
    delete(id: number): Promise<boolean>;
    
    // Legacy methods (kept for backward compatibility)
    findByGrade(grade: number): Promise<Student[]>;
    findAll(): Promise<Student[]>;
    
    // New pagination methods
    findAllWithPagination(
        pagination: StudentPaginationOptions,
        filters?: StudentFilterOptions
    ): Promise<StudentListResult>;
    
    // Search methods
    searchStudents(
        searchTerm: string,
        pagination?: StudentPaginationOptions
    ): Promise<StudentListResult>;
    
    // Filter methods
    findByFilters(
        filters: StudentFilterOptions,
        pagination?: StudentPaginationOptions
    ): Promise<StudentListResult>;
    
    // Count methods
    count(filters?: StudentFilterOptions): Promise<number>;
    countByGrade(grade: number): Promise<number>;
    countBySchool(school: string): Promise<number>;
}
