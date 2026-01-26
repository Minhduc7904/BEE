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
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  AssignUserRoleDto,
  BaseResponseDto,
  UserRoleWithPermissionsResponseDto
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import {
  CreateRoleUseCase,
  GetRoleUseCase,
  GetAllRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  AssignRoleToUserUseCase,
  GetUserRolesUseCase,
  ToggleRolePermissionUseCase,
  RemoveRoleFromUserUseCase
} from '../../application/use-cases/role'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('roles')
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,
    private readonly getUserRolesUseCase: GetUserRolesUseCase,
    private readonly toggleRolePermissionUseCase: ToggleRolePermissionUseCase,
    private readonly removeRoleFromUserUseCase: RemoveRoleFromUserUseCase,
  ) { }

  /**
   * Create a new role
   * POST /roles
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSION_CODES.ROLE_CREATE)
  async createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<RoleResponseDto>> {
    return ExceptionHandler.execute(() => this.createRoleUseCase.execute(dto, adminId))
  }

  /**
   * Get all roles
   * GET /roles
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_GET_ALL)
  async getAllRoles(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<BaseResponseDto<RoleResponseDto[]>> {
    return ExceptionHandler.execute(() => this.getAllRolesUseCase.execute(limit, offset))
  }

  /**
   * Get role by ID
   * GET /roles/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_GET_BY_ID)
  async getRole(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<RoleResponseDto>> {
    return ExceptionHandler.execute(() => this.getRoleUseCase.execute(id))
  }

  /**
   * Update role
   * PUT /roles/:id
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_UPDATE)
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<RoleResponseDto>> {
    return ExceptionHandler.execute(() => this.updateRoleUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete role
   * DELETE /roles/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_DELETE)
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return ExceptionHandler.execute(() => this.deleteRoleUseCase.execute(id, adminId))
  }

  /**
   * Assign role to user
   * POST /roles/assign
   */
  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_ASSIGN)
  async assignRoleToUser(
    @Body() dto: AssignUserRoleDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ message: string }>> {
    return ExceptionHandler.execute(() => this.assignRoleToUserUseCase.execute(dto, adminId))
  }

  /**
   * Remove role from user
   * DELETE /roles/remove-from-user
   */
  @Delete(':userId/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_REMOVE_FROM_USER)
  async removeRoleFromUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
    @CurrentUser() user: any,
  ) {
    return this.removeRoleFromUserUseCase.execute(
      { userId, roleId },
      user?.adminId,
    )
  }



  /**
   * Get user roles
   * GET /roles/user/:userId
   */
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_GET_USER_ROLES)
  async getUserRoles(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<BaseResponseDto<UserRoleWithPermissionsResponseDto[]>> {
    return ExceptionHandler.execute(() => this.getUserRolesUseCase.execute(userId))
  }

  /**
   * Toggle permission in role (add if not exists, remove if exists)
   * POST /roles/:roleId/permissions/:permissionId/toggle
   */
  @Post(':roleId/permissions/:permissionId/toggle')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.ROLE_TOGGLE_ROLE_PERMISSION)
  async toggleRolePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ action: 'added' | 'removed'; roleId: number; permissionId: number }>> {
    return ExceptionHandler.execute(() =>
      this.toggleRolePermissionUseCase.execute(roleId, permissionId, adminId),
    )
  }


}
