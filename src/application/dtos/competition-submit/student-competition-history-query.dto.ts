// src/application/dtos/competition-submit/student-competition-history-query.dto.ts
import { IsOptional, IsInt, Min, Max, IsEnum, IsIn } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'

const STUDENT_HISTORY_SORT_FIELDS = [
    'createdAt',
    'submittedAt',
    'attemptNumber',
    'totalPoints',
    'timeSpentSeconds',
] as const

export class StudentCompetitionHistoryQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @ToNumber()
    studentId?: number

    @IsOptional()
    @IsInt()
    @Min(1)
    @ToNumber()
    page?: number = 1

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @ToNumber()
    limit?: number = 10

    @IsOptional()
    @IsIn(STUDENT_HISTORY_SORT_FIELDS)
    sortBy?: (typeof STUDENT_HISTORY_SORT_FIELDS)[number] = 'createdAt'

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'
}
