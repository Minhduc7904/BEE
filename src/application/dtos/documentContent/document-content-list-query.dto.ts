// src/application/dtos/documentContent/document-content-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator'

export class DocumentContentListQueryDto {
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
    @IsInt()
    @Type(() => Number)
    learningItemId?: number

    @IsOptional()
    @IsString()
    search?: string
}
