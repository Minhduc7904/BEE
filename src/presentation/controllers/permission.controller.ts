import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  BaseResponseDto,
  PermissionListQueryDto,
  PaginationResponseDto,
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import {
  CreatePermissionUseCase,
  GetPermissionUseCase,
  GetAllPermissionsUseCase,
  GetPermissionGroupsUseCase,
  UpdatePermissionUseCase,
  DeletePermissionUseCase,
} from '../../application/use-cases/permission'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

import { RequirePermission } from '../../shared/decorators/permissions.decorator'

@Controller('permissions')
export class PermissionController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly getPermissionUseCase: GetPermissionUseCase,
    private readonly getAllPermissionsUseCase: GetAllPermissionsUseCase,
    private readonly getPermissionGroupsUseCase: GetPermissionGroupsUseCase,
    private readonly updatePermissionUseCase: UpdatePermissionUseCase,
    private readonly deletePermissionUseCase: DeletePermissionUseCase,
  ) { }

  /**
   * Create a new permission
   * POST /permissions
   */
  @Post()
  @RequirePermission('permission.create')
  @HttpCode(HttpStatus.CREATED)
  async createPermission(
    @Body() dto: CreatePermissionDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<PermissionResponseDto>> {
    return ExceptionHandler.execute(() => this.createPermissionUseCase.execute(dto, adminId))
  }

  /**
   * Get all permissions with pagination and filtering
   * GET /permissions
   * Query params:
   * - page: số trang (mặc định: 1)
   * - limit: số lượng mỗi trang (mặc định: 10, max: 100)
   * - search: tìm kiếm theo code, name, description
   * - group: filter theo nhóm quyền
   * - sortBy: trường sắp xếp (code, name, group, createdAt, updatedAt)
   * - sortOrder: thứ tự sắp xếp (asc, desc)
   */
  @Get()
  @RequirePermission('permission.getAll')
  @HttpCode(HttpStatus.OK)
  async getAllPermissions(
    @Query() query: PermissionListQueryDto,
  ): Promise<PaginationResponseDto<PermissionResponseDto>> {
    return ExceptionHandler.execute(() => this.getAllPermissionsUseCase.execute(query))
  }

  /**
   * Get all distinct permission groups
   * GET /permissions/groups
   */
  @Get('groups')
  @RequirePermission('permission.getGroups')
  @HttpCode(HttpStatus.OK)
  async getPermissionGroups(): Promise<BaseResponseDto<string[]>> {
    return ExceptionHandler.execute(() => this.getPermissionGroupsUseCase.execute())
  }

  /**
   * Get permission by ID
   * GET /permissions/:id
   */
  @Get(':id')
  @RequirePermission('permission.getById')
  @HttpCode(HttpStatus.OK)
  async getPermission(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<PermissionResponseDto>> {
    return ExceptionHandler.execute(() => this.getPermissionUseCase.execute(id))
  }

  /**
   * Update permission
   * PUT /permissions/:id
   */
  @Put(':id')
  @RequirePermission('permission.update')
  @HttpCode(HttpStatus.OK)
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<PermissionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.updatePermissionUseCase.execute(id, dto, adminId),
    )
  }

  /**
   * Delete permission
   * DELETE /permissions/:id
   */
  @Delete(':id')
  @RequirePermission('permission.delete')
  @HttpCode(HttpStatus.OK)
  async deletePermission(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return ExceptionHandler.execute(() => this.deletePermissionUseCase.execute(id, adminId))
  }
}
