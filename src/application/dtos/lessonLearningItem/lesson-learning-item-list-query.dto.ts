// src/application/dtos/lessonLearningItem/lesson-learning-item-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator'

export class LessonLearningItemListQueryDto {
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
    sortBy?: string = 'createdAt'

    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    lessonId?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    learningItemId?: number
}
