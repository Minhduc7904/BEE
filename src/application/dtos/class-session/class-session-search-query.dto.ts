// src/application/dtos/course/course-search-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsNumber, IsArray, IsString, MaxLength,  } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Trim } from 'src/shared/decorators/trim.decorator'
import { ToNumberArray } from 'src/shared/decorators'

export class ClassSessionSearchQueryDto {
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Từ khóa tìm kiếm') })
    @Trim()
    @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Từ khóa tìm kiếm', 255) })
    search?: string

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @ToNumberArray()
    classIds?: number[]

    /* ===================== FILTER ===================== */
    toClassSessionFilterOptions() {
        return {
            search: this.search,
            classIds: this.classIds,
        }
    }

    /* ===================== PAGINATION (FIXED) ===================== */
    toClassSessionPaginationOptions() {
        return {
            page: 1,
            limit: 10,
            sortBy: 'sessionDate',
            sortOrder: 'desc' as const,
        }
    }
}
