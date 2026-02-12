// src/application/dtos/learningItem/student-homework-query.dto.ts
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'

export enum HomeworkStatus {
    ALL = 'ALL',
    INCOMPLETE = 'INCOMPLETE', // Chưa làm
    COMPLETED = 'COMPLETED', // Đã hoàn thành
    OVERDUE = 'OVERDUE', // Quá hạn
}

export class StudentHomeworkQueryDto {
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
    sortBy?: string = 'createdAt'

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsEnum(HomeworkStatus)
    status?: HomeworkStatus = HomeworkStatus.ALL

    @IsOptional()
    @IsString()
    search?: string

    @IsOptional()
    @IsInt()
    @ToNumber()
    courseId?: number

    @IsOptional()
    @IsInt()
    @ToNumber()
    lessonId?: number
}
