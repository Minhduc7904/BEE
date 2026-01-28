// src/application/dtos/youtubeContent/youtube-content-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'
export class YoutubeContentListQueryDto {
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
    @IsInt()
    @ToNumber()
    learningItemId?: number

    @IsOptional()
    @IsString()
    search?: string
}
