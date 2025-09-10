// src/domain/interface/common/pagination.util.ts

import { PaginationMeta, PaginationResult, PaginatedResponse } from './pagination.interface';

export class PaginationUtil {
    /**
     * Tính toán pagination metadata
     */
    static calculateMeta(page: number, limit: number, total: number): PaginationMeta {
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit + 1;
        const endIndex = Math.min(page * limit, total);

        return {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            startIndex: total > 0 ? startIndex : 0,
            endIndex: total > 0 ? endIndex : 0
        };
    }

    /**
     * Tạo pagination result từ data và metadata
     */
    static createResult<T>(
        data: T[],
        page: number,
        limit: number,
        total: number
    ): PaginationResult<T> {
        const meta = this.calculateMeta(page, limit, total);
        
        return {
            data,
            total: meta.total,
            page: meta.page,
            limit: meta.limit,
            totalPages: meta.totalPages,
            hasNextPage: meta.hasNextPage,
            hasPreviousPage: meta.hasPreviousPage
        };
    }

    /**
     * Tạo paginated response với meta object riêng
     */
    static createResponse<T>(
        data: T[],
        page: number,
        limit: number,
        total: number
    ): PaginatedResponse<T> {
        const meta = this.calculateMeta(page, limit, total);
        
        return {
            data,
            meta
        };
    }

    /**
     * Validate pagination parameters
     */
    static validateParams(page: number, limit: number): { page: number; limit: number } {
        const validPage = Math.max(1, Math.floor(page));
        const validLimit = Math.max(1, Math.min(100, Math.floor(limit))); // Max 100 items per page
        
        return {
            page: validPage,
            limit: validLimit
        };
    }

    /**
     * Tính toán offset cho database query
     */
    static calculateOffset(page: number, limit: number): number {
        return (page - 1) * limit;
    }

    /**
     * Tạo default pagination options
     */
    static getDefaultOptions() {
        return {
            page: 1,
            limit: 10
        };
    }

    /**
     * Merge pagination options với defaults
     */
    static mergeWithDefaults<T>(
        options?: Partial<{ page: number; limit: number; sortBy?: T }>
    ): { page: number; limit: number; sortBy?: T } {
        const defaults = this.getDefaultOptions();
        
        return {
            page: options?.page ?? defaults.page,
            limit: options?.limit ?? defaults.limit,
            sortBy: options?.sortBy
        };
    }
}
