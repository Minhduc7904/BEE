// src/domain/interface/admin/admin.interface.ts

import { PaginationOptions, PaginationResult, BaseFilterOptions, SortOptions } from '../common/pagination.interface';

export interface CreateAdminData {
    userId: number;
    subjectId?: number;
}

export interface UpdateAdminData {
    subjectId?: number;
}

// Admin-specific sort fields
export type AdminSortField =
    | 'adminId'
    | 'userId'
    | 'subjectId'
    | 'username'
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'createdAt'
    | 'updatedAt'
    | 'lastLoginAt';

// Admin sort options
export type AdminSortOptions = SortOptions<AdminSortField>;

// Admin filter options
export interface AdminFilterOptions extends BaseFilterOptions {
    // Admin-specific fields
    subjectId?: number;

    // User fields (từ relation)
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;

    // Additional date filters
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
}

// Admin pagination options
export interface AdminPaginationOptions extends PaginationOptions<AdminSortField> { }

// Admin list result
export interface AdminListResult extends PaginationResult<any> { }
