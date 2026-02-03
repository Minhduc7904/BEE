// src/application/dtos/course/course-search-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsNumber, IsArray, IsString, MaxLength,  } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Trim } from 'src/shared/decorators/trim.decorator'
import { ToNumberArray } from 'src/shared/decorators'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { IsOptionalString, IsOptionalIdNumber, IsOptionalIntArray } from 'src/shared/decorators/validate'

export class ClassSessionSearchQueryDto {
    @IsOptionalString('Từ khóa tìm kiếm', 255)
    search?: string

    @IsOptionalIntArray('IDs lớp học')
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
            sortOrder: SortOrder.DESC,
        }
    }
}
