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
