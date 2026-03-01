// src/application/dtos/competition-submit/student-competition-history-query.dto.ts
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'

export class StudentCompetitionHistoryQueryDto {
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
    sortBy?: string = 'submittedAt'

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'
}
