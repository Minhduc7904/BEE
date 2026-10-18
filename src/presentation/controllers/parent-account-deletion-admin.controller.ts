import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AllowParentRegistrationUseCase } from '../../application/use-cases/admin/allow-parent-registration.use-case'
import { AllowParentRegistrationDto } from '../../application/dtos/auth/parent-account-deletion.dto'
import { BaseResponseDto } from '../../application/dtos'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('admin/parent-account-deletions')
export class ParentAccountDeletionAdminController {
  constructor(private readonly allowParentRegistration: AllowParentRegistrationUseCase) {}

  @Post('allow-registration')
  @RequirePermission(PERMISSION_CODES.USER.MANAGE_ACCOUNT_DELETION)
  @HttpCode(HttpStatus.OK)
  execute(
    @Body() dto: AllowParentRegistrationDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ allowed: true }>> {
    return this.allowParentRegistration.execute(dto, adminId)
  }
}
