import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { CreateRoleDto, RoleResponseDto } from '../../application/dtos/role/role.dto'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'
import { ErrorResponseDto } from 'src/application/dtos/common/error-response.dto'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CreateRoleUseCase } from '../../application/use-cases/role/create-role.use-case'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../infrastructure/services/auth.service'
import { AdminOnly } from '../../shared/decorators/permission.decorator'

@Controller('roles')
export class RoleController {
  constructor(private readonly createRoleUseCase: CreateRoleUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AdminOnly() // Sử dụng decorator mới - chỉ ADMIN, SUPER_ADMIN tự động có quyền
  async createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<RoleResponseDto>> {
    return ExceptionHandler.execute(() => this.createRoleUseCase.execute(dto, adminId))
  }
}
