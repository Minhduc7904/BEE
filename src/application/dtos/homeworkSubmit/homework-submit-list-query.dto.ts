// src/application/dtos/homeworkSubmit/homework-submit-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsEnum, IsString, IsBoolean } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'

export class HomeworkSubmitListQueryDto {
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
    @IsString()
    sortBy?: string = 'submitAt'

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsInt()
    @ToNumber()
    homeworkContentId?: number

    @IsOptional()
    @IsInt()
    @ToNumber()
    studentId?: number

    @IsOptional()
    @IsInt()
    @ToNumber()
    graderId?: number

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isGraded?: boolean

    @IsOptional()
    @IsString()
    search?: string
}
