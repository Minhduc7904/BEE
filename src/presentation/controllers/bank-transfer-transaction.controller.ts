import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'

import {
  BankTransferTransactionDetailResponseDto,
  BankTransferTransactionListQueryDto,
  BankTransferTransactionResponseDto,
  BankTransferTransactionStatisticsQueryDto,
  BankTransferTransactionStatisticsResponseDto,
  BaseResponseDto,
  PaginationResponseDto,
  SyncSepayTransactionsResponseDto,
} from '../../application/dtos'
import {
  GetBankTransferTransactionByIdUseCase,
  GetBankTransferTransactionsUseCase,
  GetBankTransferTransactionsForTuitionPaymentUseCase,
  GetBankTransferTransactionStatisticsUseCase,
  SyncSepayTransactionsUseCase,
} from '../../application/use-cases/bank-transfer-transaction'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { ROLE_NAMES } from '../../shared/constants/roles.constant'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import type { AuthenticatedUser } from '../../shared/guards/auth.guard'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/bank-transfer-transactions')
export class BankTransferTransactionController {
  constructor(
    private readonly getBankTransferTransactionsUseCase: GetBankTransferTransactionsUseCase,
    private readonly getBankTransferTransactionsForTuitionPaymentUseCase: GetBankTransferTransactionsForTuitionPaymentUseCase,
    private readonly getBankTransferTransactionByIdUseCase: GetBankTransferTransactionByIdUseCase,
    private readonly getBankTransferTransactionStatisticsUseCase: GetBankTransferTransactionStatisticsUseCase,
    private readonly syncSepayTransactionsUseCase: SyncSepayTransactionsUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.BANK_TRANSFER_TRANSACTION.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getBankTransferTransactions(
    @Query() query: BankTransferTransactionListQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginationResponseDto<BankTransferTransactionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getBankTransferTransactionsUseCase.execute(query, this.canViewSensitiveAccountNumber(user)),
    )
  }

  @Get('statistics')
  @RequirePermission(PERMISSION_CODES.BANK_TRANSFER_TRANSACTION.STATS)
  @HttpCode(HttpStatus.OK)
  async getBankTransferTransactionStatistics(
    @Query() query: BankTransferTransactionStatisticsQueryDto,
  ): Promise<BaseResponseDto<BankTransferTransactionStatisticsResponseDto>> {
    return ExceptionHandler.execute(() => this.getBankTransferTransactionStatisticsUseCase.execute(query))
  }

  @Post('sync-sepay')
  @RequirePermission(PERMISSION_CODES.BANK_TRANSFER_TRANSACTION.SYNC_SEPAY)
  @HttpCode(HttpStatus.OK)
  async syncSepayTransactions(
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<SyncSepayTransactionsResponseDto>> {
    return ExceptionHandler.execute(() => this.syncSepayTransactionsUseCase.execute(adminId))
  }

  @Get('tuition-payment/:tuitionPaymentId')
  @RequirePermission(PERMISSION_CODES.BANK_TRANSFER_TRANSACTION.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getBankTransferTransactionsForTuitionPayment(
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @Query() query: BankTransferTransactionListQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginationResponseDto<BankTransferTransactionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getBankTransferTransactionsForTuitionPaymentUseCase.execute(
        tuitionPaymentId,
        query,
        this.canViewSensitiveAccountNumber(user),
      ),
    )
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.BANK_TRANSFER_TRANSACTION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getBankTransferTransactionById(
    @Param('id', ParseIntPipe) bankTransferTransactionId: number,
  ): Promise<BaseResponseDto<BankTransferTransactionDetailResponseDto>> {
    return ExceptionHandler.execute(() => this.getBankTransferTransactionByIdUseCase.execute(bankTransferTransactionId))
  }

  private canViewSensitiveAccountNumber(user: AuthenticatedUser): boolean {
    return (
      user.roles.some((role) => role.name === ROLE_NAMES.SUPER_ADMIN) ||
      user.permissions.some((permission) => permission.code === PERMISSION_CODES.RECEIVING_BANK_ACCOUNT.VIEW_SENSITIVE)
    )
  }
}
