import { Injectable, Inject } from '@nestjs/common'
import { PermissionResponseDto, PaginationResponseDto, PermissionListQueryDto } from '../../dtos'
import type { IPermissionRepository } from '../../../domain/repositories'

@Injectable()
export class GetAllPermissionsUseCase {
  constructor(
    @Inject('IPermissionRepository') private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(query: PermissionListQueryDto): Promise<PaginationResponseDto<PermissionResponseDto>> {
    // Normalize query data
    query.normalize()
    // console.log('Query after normalize:', query)
    // Validate sort field if provided
    if (!query.validatePermissionSortFields()) {
      return PaginationResponseDto.error(
        `Invalid sort field. Allowed fields: permissionId, code, name, group, createdAt, updatedAt`,
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
      group: query.group,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }

    // Fetch data with pagination
    const { data: permissions, total } = await this.permissionRepository.findAllWithPagination(options)

    // Map to response DTOs
    const responseData = permissions.map(permission => 
      PermissionResponseDto.fromPermission(permission)
    )

    return PaginationResponseDto.success(
      'Get all permissions successfully',
      responseData,
      query.page || 1,
      query.limit || 10,
      total,
    )
  }
}
