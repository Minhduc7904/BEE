// src/application/dtos/learningItem/learning-item-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator'
import { LearningItemType } from '../../../shared/enums'

export class LearningItemListQueryDto {
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
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsEnum(LearningItemType)
    type?: LearningItemType

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    createdBy?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    competitionId?: number

    @IsOptional()
    @IsString()
    search?: string
}
