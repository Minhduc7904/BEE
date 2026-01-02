// src/application/dtos/permission/permission-list-query.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class PermissionListQueryDto extends ListQueryDto {
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Nhóm quyền') })
    @Trim()
    @MaxLength(100, { message: VALIDATION_MESSAGES.FIELD_MAX('Nhóm quyền', 100) })
    group?: string

    /**
     * Chuyển đổi DTO thành filter options cho repository
     */
    toPermissionFilterOptions() {
        return {
            search: this.search,
            group: this.group,
            fromDate: this.fromDate,
            toDate: this.toDate,
        }
    }

    /**
     * Chuyển đổi thành pagination options cho repository
     */
    toPermissionPaginationOptions() {
        const sortField = this.sortBy || 'createdAt'
        const sortDirection = this.sortOrder || 'desc'

        // Validate sort field
        const allowedSortFields = [
            'permissionId',
            'code',
            'name',
            'group',
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
    validatePermissionSortFields(): boolean {
        const allowedFields = [
            'permissionId',
            'code',
            'name',
            'group',
            'createdAt',
            'updatedAt',
        ]

        if (!this.sortBy) return true
        return allowedFields.includes(this.sortBy)
    }
}
