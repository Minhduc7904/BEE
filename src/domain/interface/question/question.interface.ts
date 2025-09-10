// src/domain/interface/question/question.interface.ts

import { PaginationOptions, PaginationResult, BaseFilterOptions, SortOptions } from '../common/pagination.interface';
import { QuestionType } from '../../../shared/enums/question-type.enum';
import { Difficulty } from '../../../shared/enums/difficulty.enum';

export interface CreateQuestionData {
    content: string;
    type: QuestionType;
    difficulty: Difficulty;
    grade: number;
    imageId?: number;
    correctAnswer?: string;
    solution?: string;
    chapter?: string;
    solutionYoutubeUrl?: string;
    solutionImageId?: number;
    subjectId?: number;
    createdBy?: number;
}

export interface UpdateQuestionData {
    content?: string;
    type?: QuestionType;
    difficulty?: Difficulty;
    grade?: number;
    imageId?: number;
    correctAnswer?: string;
    solution?: string;
    chapter?: string;
    solutionYoutubeUrl?: string;
    solutionImageId?: number;
    subjectId?: number;
}

// Question-specific sort fields
export type QuestionSortField = 
    | 'questionId' 
    | 'content'
    | 'type' 
    | 'difficulty'
    | 'grade' 
    | 'subjectId'
    | 'chapter'
    | 'createdBy'
    | 'createdAt' 
    | 'updatedAt';

// Question sort options
export type QuestionSortOptions = SortOptions<QuestionSortField>;

// Question filter options
export interface QuestionFilterOptions extends BaseFilterOptions {
    // Question-specific fields
    type?: QuestionType;
    difficulty?: Difficulty;
    grade?: number;
    subjectId?: number;
    chapter?: string;
    createdBy?: number;
    
    // Content filters
    hasImage?: boolean;
    hasCorrectAnswer?: boolean;
    hasSolution?: boolean;
    hasSolutionYoutube?: boolean;
    hasSolutionImage?: boolean;
}

// Question pagination options
export interface QuestionPaginationOptions extends PaginationOptions<QuestionSortField> {}

// Question list result
export interface QuestionListResult extends PaginationResult<any> {}
