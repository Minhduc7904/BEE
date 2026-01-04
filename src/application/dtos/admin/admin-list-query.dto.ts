// src/application/dtos/admin/admin-list-query.dto.ts
import { IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { Trim, ToBoolean } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class AdminListQueryDto extends ListQueryDto {
    @IsOptional()
    @ToBoolean()
    @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái hoạt động') })
    isActive?: boolean

    /**
     * Chuyển đổi DTO thành filter options cho repository
     * @return object
     */
    toAdminFilterOptions() {
        return {
            search: this.search,
            fromDate: this.fromDate,
            toDate: this.toDate,
            isActive: this.isActive,
        }
    }

    /**
     * Chuyển đổi thành pagination options cho repository
     */
    toAdminPaginationOptions() {
        const sortField = this.sortBy || 'createdAt'
        const sortDirection = this.sortOrder || 'desc'
        // Validate sort field
        const allowedSortFields = [
            'adminId',
            'subject',
            'createdAt',
            'updatedAt',
        ]
        const validSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt'

        return {
            page: this.page || 1,
            limit: this.limit || 10,
            sortBy: validSortField,
            sortOrder: sortDirection,
        }
    }

    /**
     * Validate sort field có hợp lệ không
     */
    validateAdminSortFields(): boolean {
        const allowedFields = [
            'adminId',
            'subject',
            'createdAt',
            'updatedAt',
        ]
        return this.sortBy ? allowedFields.includes(this.sortBy) : true
    }
}