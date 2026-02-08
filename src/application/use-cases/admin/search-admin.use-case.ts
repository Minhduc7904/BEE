// src/application/use-cases/admin/search-admin.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import { AdminResponseDto, PaginationResponseDto } from '../../dtos'
import { AdminSearchQueryDto } from '../../dtos/admin/admin-search-query.dto'
import type { IAdminRepository } from '../../../domain/repositories'

@Injectable()
export class SearchAdminUseCase {
    constructor(
        @Inject('IAdminRepository')
        private readonly adminRepository: IAdminRepository,
    ) { }

    async execute(query: AdminSearchQueryDto): Promise<PaginationResponseDto<AdminResponseDto>> {
        // Get filter and pagination options from DTO
        const filters = query.toAdminFilterOptions()
        const pagination = query.toAdminPaginationOptions()

        // Prepare repository options
        const options = {
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
            search: filters.search,
            isActive: filters.isActive,
            subjectId: filters.subjectId,
            sortBy: pagination.sortBy,
            sortOrder: pagination.sortOrder,
        }

        // Fetch data with pagination
        const { data: admins, total } = await this.adminRepository.findAllWithPagination(options)

        // Map to response DTOs
        const responseData = admins.map(admin =>
            AdminResponseDto.fromUserWithAdmin(admin.user, admin)
        )

        return PaginationResponseDto.success(
            'Tìm kiếm admin thành công',
            responseData,
            pagination.page,
            pagination.limit,
            total,
        )
    }
}
