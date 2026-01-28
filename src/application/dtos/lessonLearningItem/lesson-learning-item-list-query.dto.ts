// src/application/dtos/lessonLearningItem/lesson-learning-item-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'

export class LessonLearningItemListQueryDto {
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
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsInt()
    @ToNumber()
    lessonId?: number

    @IsOptional()
    @IsInt()
    @ToNumber()
    learningItemId?: number
}
