import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'

import {
  BaseResponseDto,
  CreateReceivingBankAccountDto,
  PaginationResponseDto,
  ReceivingBankAccountBalanceResponseDto,
  ReceivingBankAccountListQueryDto,
  ReceivingBankAccountResponseDto,
  SyncReceivingBankAccountsFromSepayResponseDto,
  UpdateReceivingBankAccountDto,
} from '../../application/dtos'
import {
  ActivateReceivingBankAccountUseCase,
  CreateReceivingBankAccountUseCase,
  DeactivateReceivingBankAccountUseCase,
  GetReceivingBankAccountsUseCase,
  GetReceivingBankAccountBalanceUseCase,
  SyncReceivingBankAccountsFromSepayUseCase,
  UpdateReceivingBankAccountUseCase,
} from '../../application/use-cases/receiving-bank-account'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { ROLE_NAMES } from '../../shared/constants/roles.constant'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import type { AuthenticatedUser } from '../../shared/guards/auth.guard'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/receiving-bank-accounts')
export class ReceivingBankAccountController {
  constructor(
    private readonly getReceivingBankAccountsUseCase: GetReceivingBankAccountsUseCase,
    private readonly getReceivingBankAccountBalanceUseCase: GetReceivingBankAccountBalanceUseCase,
    private readonly syncReceivingBankAccountsFromSepayUseCase: SyncReceivingBankAccountsFromSepayUseCase,
    private readonly createReceivingBankAccountUseCase: CreateReceivingBankAccountUseCase,
    private readonly updateReceivingBankAccountUseCase: UpdateReceivingBankAccountUseCase,
    private readonly activateReceivingBankAccountUseCase: ActivateReceivingBankAccountUseCase,
    private readonly deactivateReceivingBankAccountUseCase: DeactivateReceivingBankAccountUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getReceivingBankAccounts(
    @Query() query: ReceivingBankAccountListQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginationResponseDto<ReceivingBankAccountResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getReceivingBankAccountsUseCase.execute(
        query,
        this.canViewSensitiveAccountNumber(user),
      ),
    )
  }

  @Get(':id/sepay-balance')
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.VIEW_BALANCE)
  @HttpCode(HttpStatus.OK)
  async getReceivingBankAccountBalance(
    @Param('id', ParseIntPipe) receivingBankAccountId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ReceivingBankAccountBalanceResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getReceivingBankAccountBalanceUseCase.execute(
        receivingBankAccountId,
        this.canViewSensitiveAccountNumber(user),
      ),
    )
  }

  @Post('sync-from-sepay')
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.SYNC_FROM_SEPAY)
  @HttpCode(HttpStatus.OK)
  async syncReceivingBankAccountsFromSepay(
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<SyncReceivingBankAccountsFromSepayResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.syncReceivingBankAccountsFromSepayUseCase.execute(adminId),
    )
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createReceivingBankAccount(
    @Body() dto: CreateReceivingBankAccountDto,
    @CurrentUser('adminId') adminId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ReceivingBankAccountResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createReceivingBankAccountUseCase.execute(
        dto,
        adminId,
        this.canViewSensitiveAccountNumber(user),
      ),
    )
  }

  @Post(':id/activate')
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async activateReceivingBankAccount(
    @Param('id', ParseIntPipe) receivingBankAccountId: number,
    @CurrentUser('adminId') adminId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ReceivingBankAccountResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.activateReceivingBankAccountUseCase.execute(
        receivingBankAccountId,
        adminId,
        this.canViewSensitiveAccountNumber(user),
      ),
    )
  }

  @Post(':id/deactivate')
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async deactivateReceivingBankAccount(
    @Param('id', ParseIntPipe) receivingBankAccountId: number,
    @CurrentUser('adminId') adminId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ReceivingBankAccountResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.deactivateReceivingBankAccountUseCase.execute(
        receivingBankAccountId,
        adminId,
        this.canViewSensitiveAccountNumber(user),
      ),
    )
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateReceivingBankAccount(
    @Param('id', ParseIntPipe) receivingBankAccountId: number,
    @Body() dto: UpdateReceivingBankAccountDto,
    @CurrentUser('adminId') adminId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ReceivingBankAccountResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.updateReceivingBankAccountUseCase.execute(
        receivingBankAccountId,
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
