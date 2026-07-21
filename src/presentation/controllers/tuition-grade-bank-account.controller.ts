import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common'

import {
  BaseResponseDto,
  TuitionGradeBankAccountResponseDto,
  UpdateTuitionGradeBankAccountsDto,
} from '../../application/dtos'
import {
  GetTuitionGradeBankAccountsUseCase,
  UpdateTuitionGradeBankAccountsUseCase,
} from '../../application/use-cases/tuition-grade-bank-account'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { ROLE_NAMES } from '../../shared/constants/roles.constant'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import type { AuthenticatedUser } from '../../shared/guards/auth.guard'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/tuition-grade-bank-accounts')
export class TuitionGradeBankAccountController {
  constructor(
    private readonly getTuitionGradeBankAccountsUseCase: GetTuitionGradeBankAccountsUseCase,
    private readonly updateTuitionGradeBankAccountsUseCase: UpdateTuitionGradeBankAccountsUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.CONFIGURE_GRADE_MAPPING)
  @HttpCode(HttpStatus.OK)
  async getTuitionGradeBankAccounts(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<TuitionGradeBankAccountResponseDto[]>> {
    return ExceptionHandler.execute(() =>
      this.getTuitionGradeBankAccountsUseCase.execute(this.canViewSensitiveAccountNumber(user)),
    )
  }

  @Put()
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.CONFIGURE_GRADE_MAPPING)
  @HttpCode(HttpStatus.OK)
  async updateTuitionGradeBankAccounts(
    @Body() dto: UpdateTuitionGradeBankAccountsDto,
    @CurrentUser('adminId') adminId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<TuitionGradeBankAccountResponseDto[]>> {
    return ExceptionHandler.execute(() =>
      this.updateTuitionGradeBankAccountsUseCase.execute(
        dto,
        adminId,
        this.canViewSensitiveAccountNumber(user),
      ),
    )
  }

  private canViewSensitiveAccountNumber(user: AuthenticatedUser): boolean {
    return (
      user.roles.some((role) => role.name === ROLE_NAMES.SUPER_ADMIN) ||
      user.permissions.some(
        (permission) => permission.code === PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.VIEW_SENSITIVE,
      )
    )
  }
}
