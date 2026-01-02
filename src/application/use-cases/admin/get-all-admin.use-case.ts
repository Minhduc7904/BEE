import { Injectable, Inject } from "@nestjs/common";
import { AdminResponseDto, PaginationResponseDto, AdminListQueryDto } from "../../dtos";
import type { IAdminRepository } from "../../../domain/repositories";

@Injectable()
export class GetAllAdminUseCase {
    constructor(
        @Inject("IAdminRepository")
        private readonly adminRepository: IAdminRepository,
    ) { }

    async execute(query: AdminListQueryDto): Promise<PaginationResponseDto<AdminResponseDto>> {
        // Normalize query data
        query.normalize()

        // Validate sort field if provided
        if (!query.validateAdminSortFields()) {
            return PaginationResponseDto.error(
                `Invalid sort field. Allowed fields: adminId, userId, createdAt, updatedAt`,
                query.page,
                query.limit,
            )
        }

        // Validate date range if provided
        if (!query.validateDateRange()) {
            return PaginationResponseDto.error(
                'Invalid date range: fromDate must be before toDate',
                query.page,
                query.limit,
            )
        }

        // Prepare repository options
        const options = {
            skip: query.offset,
            take: query.limit,
            search: query.search,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        // Fetch data with pagination
        const { data: admins, total } = await this.adminRepository.findAllWithPagination(options)

        // Map to response DTOs
        const responseData = admins.map(admin =>
            AdminResponseDto.fromUserWithAdmin(admin.user, admin)
        )

        return PaginationResponseDto.success(
            'Get all admins successfully',
            responseData,
            query.page || 1,
            query.limit || 10,
            total,
        )
    }
}