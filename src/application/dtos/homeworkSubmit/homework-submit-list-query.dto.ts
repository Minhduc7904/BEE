// src/application/dtos/homeworkSubmit/homework-submit-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsEnum, IsString, IsBoolean } from 'class-validator'

export class HomeworkSubmitListQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 10

    @IsOptional()
    @IsString()
    sortBy?: string = 'submitAt'

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    homeworkContentId?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    studentId?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    graderId?: number

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isGraded?: boolean

    @IsOptional()
    @IsString()
    search?: string
}
