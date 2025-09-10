import { PaginationOptions, PaginationResult, BaseFilterOptions, SortOptions } from '../common/pagination.interface';
// Note: Import Student entity when needed, avoiding circular dependency

export interface CreateStudentData {
    userId: number;
    studentPhone?: string;
    parentPhone?: string;
    grade: number;
    school?: string;
}

// Student-specific sort fields
export type StudentSortField = 
    | 'studentId' 
    | 'userId' 
    | 'grade' 
    | 'school' 
    | 'username' 
    | 'email' 
    | 'firstName' 
    | 'lastName' 
    | 'createdAt' 
    | 'updatedAt' 
    | 'lastLoginAt';

// Student sort options
export type StudentSortOptions = SortOptions<StudentSortField>;

// Student filter options extending base filters
export interface StudentFilterOptions extends BaseFilterOptions {
    // Student-specific fields
    grade?: number;
    school?: string;
    studentPhone?: string;
    parentPhone?: string;

    // User fields (từ relation)
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;

    // Additional date filters
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
}

// Student pagination options
export interface StudentPaginationOptions extends PaginationOptions<StudentSortField> {}

// Student list result (generic type will be resolved at usage)
export interface StudentListResult extends PaginationResult<any> {}
