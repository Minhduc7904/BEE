// src/application/dtos/learningItem/learning-item-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator'
import { LearningItemType } from '../../../shared/enums'
import { ToNumber } from 'src/shared/decorators'

export class LearningItemListQueryDto {
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
    @IsEnum(LearningItemType)
    type?: LearningItemType

    @IsOptional()
    @IsInt()
    @ToNumber()
    createdBy?: number

    @IsOptional()
    @IsInt()
    @ToNumber()
    competitionId?: number

    @IsOptional()
    @IsString()
    search?: string
}
