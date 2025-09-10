// src/domain/interface/exam/exam.interface.ts

import { PaginationOptions, PaginationResult, BaseFilterOptions, SortOptions } from '../common/pagination.interface';

export interface CreateExamData {
    title: string;
    description?: string;
    grade: number;
    subjectId?: number;
    fileId?: number;
    solutionFileId?: number;
    createdBy: number;
}

export interface UpdateExamData {
    title?: string;
    description?: string;
    grade?: number;
    subjectId?: number;
    fileId?: number;
    solutionFileId?: number;
}

// Exam-specific sort fields
export type ExamSortField = 
    | 'examId' 
    | 'title' 
    | 'grade' 
    | 'subjectId'
    | 'createdBy'
    | 'createdAt' 
    | 'updatedAt';

// Exam sort options
export type ExamSortOptions = SortOptions<ExamSortField>;

// Exam filter options
export interface ExamFilterOptions extends BaseFilterOptions {
    // Exam-specific fields
    title?: string;
    grade?: number;
    subjectId?: number;
    createdBy?: number;
    
    // File filters
    hasFile?: boolean;
    hasSolutionFile?: boolean;
}

// Exam pagination options
export interface ExamPaginationOptions extends PaginationOptions<ExamSortField> {}

// Exam list result
export interface ExamListResult extends PaginationResult<any> {}
