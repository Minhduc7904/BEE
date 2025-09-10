

// Base pagination options
export interface BasePaginationOptions {
    page: number;
    limit: number;
}

// Generic sort options
export interface SortOptions<T = string> {
    field: T;
    direction: 'asc' | 'desc';
}

// Generic pagination options với sort
export interface PaginationOptions<TSortField = string> extends BasePaginationOptions {
    sortBy?: SortOptions<TSortField>;
}

// Generic pagination result
export interface PaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Generic filter options base
export interface BaseFilterOptions {
    // Common date filters
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    
    // Common status filters
    isActive?: boolean;
    
    // Search across multiple fields
    search?: string;
}

// Pagination metadata
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
}

// Utility type for creating paginated responses
export type PaginatedResponse<T> = {
    data: T[];
    meta: PaginationMeta;
}

