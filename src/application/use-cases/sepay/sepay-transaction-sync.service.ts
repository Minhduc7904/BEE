import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { BaseResponseDto } from 'src/application/dtos'
import { SepayService, SepayV2Transaction } from 'src/application/interfaces'
import type { JsonPayload } from 'src/domain/interface/tuition-online-payment'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import {
  AuditStatus,
  BackgroundJobCode,
  BackgroundJobRunStatus,
  BankTransferProcessingStatus,
  SepayTransactionTransferType,
} from 'src/shared/enums'
import { parseSepayTransactionDate } from './transaction-processing/sepay-transaction-date.util'
import { delay } from './transaction-processing/delay.util'
import { SepayPaymentConfirmationNotifierService } from './transaction-processing/sepay-payment-confirmation-notifier.service'
import type {
  IncomingSepayTransaction,
  ProcessSepayTransactionResult,
} from './transaction-processing/sepay-transaction-processing.types'
import { SepayTransactionProcessorService } from './transaction-processing/sepay-transaction-processor.service'

const SEPAY_SYNC_CURSOR_SCOPE = 'IN_ALL'
const SEPAY_SYNC_PAGE_SIZE = 100
const SEPAY_SYNC_PAGE_DELAY_MS = 350
const SEPAY_SYNC_JOB = {
  code: BackgroundJobCode.SEPAY_TRANSACTION_SYNC,
  displayName: 'Đồng bộ giao dịch SePay',
  cronExpression: '0 */5 * * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 300,
} as const

export interface RunSepayTransactionSyncInput {
  workerId: string
  adminId?: number
}

export interface SepayTransactionSyncResult {
  backgroundJobRunId: number
  fetchedTransactions: number
  newTransactions: number
  duplicateTransactions: number
  automaticallyMatchedTransactions: number
  lastSinceId: string | null
}

@Injectable()
export class SepayTransactionSyncService {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly sepayService: SepayService,
    private readonly transactionProcessor: SepayTransactionProcessorService,
    private readonly paymentConfirmationNotifier: SepayPaymentConfirmationNotifierService,
  ) {}

  async executeScheduled(input: Pick<RunSepayTransactionSyncInput, 'workerId'>): Promise<boolean> {
    const job = await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRepository.upsert(SEPAY_SYNC_JOB),
    )
    if (!job.canRun()) return false

    await this.execute(input)
    return true
  }

  async execute(input: RunSepayTransactionSyncInput): Promise<BaseResponseDto<SepayTransactionSyncResult>> {
    const execution = await this.acquireExecution(input)
    if (!execution.acquired) {
      throw new ConflictException({
        statusCode: 409,
        code: 'SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING',
        message: 'Đồng bộ giao dịch SePay đang chạy',
        retryAt: execution.leaseExpiresAt?.toISOString() ?? null,
      })
    }

    try {
      const result = await this.syncTransactions()
      await this.completeExecution(execution.backgroundJobRunId, input.adminId, result)
      return BaseResponseDto.success('Đồng bộ giao dịch SePay thành công', {
        backgroundJobRunId: execution.backgroundJobRunId,
        ...result,
      })
    } catch (error) {
      await this.failExecution(execution.backgroundJobRunId, input.adminId, error)
      throw error
    } finally {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.backgroundJobLockRepository.release(execution.backgroundJobId, execution.lockToken),
      )
    }
  }

  private async acquireExecution(
    input: RunSepayTransactionSyncInput,
  ): Promise<
    | { acquired: true; backgroundJobId: number; backgroundJobRunId: number; lockToken: string }
    | { acquired: false; leaseExpiresAt?: Date }
  > {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const job = await repos.backgroundJobRepository.upsert(SEPAY_SYNC_JOB)
      const now = new Date()
      const lockToken = randomUUID()
      const lock = await repos.backgroundJobLockRepository.tryAcquire({
        backgroundJobId: job.backgroundJobId,
        lockToken,
        workerId: input.workerId,
        lockedAt: now,
        leaseExpiresAt: new Date(now.getTime() + job.maxRuntimeSeconds * 1000),
      })
      if (!lock) {
        const activeLock = await repos.backgroundJobLockRepository.findByBackgroundJobId(job.backgroundJobId)
        return { acquired: false as const, leaseExpiresAt: activeLock?.leaseExpiresAt }
      }

      const latestRun = await repos.backgroundJobRunRepository.findLatestByBackgroundJobId(job.backgroundJobId)
      const scheduledAt = this.nextScheduledAt(latestRun?.scheduledAt, now)
      const run = await repos.backgroundJobRunRepository.create({
        backgroundJobId: job.backgroundJobId,
        scheduledAt,
        startedAt: now,
        status: BackgroundJobRunStatus.RUNNING,
        workerId: input.workerId,
        lockToken,
        leaseExpiresAt: lock.leaseExpiresAt,
      })
      return {
        acquired: true as const,
        backgroundJobId: job.backgroundJobId,
        backgroundJobRunId: run.backgroundJobRunId,
        lockToken,
      }
    })
  }

  private async syncTransactions(): Promise<Omit<SepayTransactionSyncResult, 'backgroundJobRunId'>> {
    const cursor = await this.unitOfWork.executeInTransaction((repos) =>
      repos.sepayTransactionSyncCursorRepository.upsert({ scope: SEPAY_SYNC_CURSOR_SCOPE }),
    )
    let sinceId = cursor.lastSinceId
    let fetchedTransactions = 0
    let newTransactions = 0
    let duplicateTransactions = 0
    let automaticallyMatchedTransactions = 0
    let hasMore = true

    while (hasMore) {
      const page = await this.sepayService.listV2Transactions({
        sinceId,
        perPage: SEPAY_SYNC_PAGE_SIZE,
        transferType: SepayTransactionTransferType.IN,
      })
      if (page.transactions.length === 0) break

      const pageResult = await this.processPage(page.transactions)
      fetchedTransactions += page.transactions.length
      newTransactions += pageResult.newTransactions
      duplicateTransactions += pageResult.duplicateTransactions
      automaticallyMatchedTransactions += pageResult.automaticallyMatchedTransactions
      sinceId = page.transactions[page.transactions.length - 1].sepayV2TransactionId
      hasMore = page.hasMore

      if (hasMore) await delay(SEPAY_SYNC_PAGE_DELAY_MS)
    }

    if (fetchedTransactions === 0) {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.sepayTransactionSyncCursorRepository.updateByScope(SEPAY_SYNC_CURSOR_SCOPE, {
          lastSyncedAt: new Date(),
          lastErrorAt: null,
          lastErrorMessage: null,
        }),
      )
    }

    return {
      fetchedTransactions,
      newTransactions,
      duplicateTransactions,
      automaticallyMatchedTransactions,
      lastSinceId: sinceId ?? null,
    }
  }

  private async processPage(transactions: SepayV2Transaction[]): Promise<{
    newTransactions: number
    duplicateTransactions: number
    automaticallyMatchedTransactions: number
  }> {
    const { results } = await this.unitOfWork.executeInTransaction(async (repos) => {
      const results: ProcessSepayTransactionResult[] = []
      for (const transaction of transactions) {
        results.push(
          await this.transactionProcessor.processInTransaction(repos, this.toIncomingTransaction(transaction)),
        )
      }
      const lastTransaction = transactions[transactions.length - 1]
      await repos.sepayTransactionSyncCursorRepository.updateByScope(SEPAY_SYNC_CURSOR_SCOPE, {
        lastSinceId: lastTransaction.sepayV2TransactionId,
        lastSyncedAt: new Date(),
        lastErrorAt: null,
        lastErrorMessage: null,
      })
      return { results }
    })

    for (const result of results) await this.paymentConfirmationNotifier.notify(result)
    return {
      newTransactions: results.filter((result) => !result.duplicate).length,
      duplicateTransactions: results.filter((result) => result.duplicate).length,
      automaticallyMatchedTransactions: results.filter(
        (result) => !result.duplicate && result.processingStatus === BankTransferProcessingStatus.MATCHED,
      ).length,
    }
  }

  private toIncomingTransaction(transaction: SepayV2Transaction): IncomingSepayTransaction {
    if (transaction.amountIn <= 0) {
      throw new Error('SePay trả về giao dịch tiền vào có số tiền không hợp lệ')
    }
    return {
      providerTransactionId: transaction.sepayV2TransactionId,
      sepayV2TransactionId: transaction.sepayV2TransactionId,
      transactionAt: parseSepayTransactionDate(transaction.transactionDate),
      receivingAccountNumber: transaction.accountNumber,
      transferType: transaction.transferType,
      transferAmount: transaction.amountIn,
      code: transaction.code,
      content: transaction.transactionContent,
      reference: transaction.referenceNumber,
      rawPayload: transaction.rawPayload as JsonPayload,
    }
  }

  private async completeExecution(
    backgroundJobRunId: number,
    adminId: number | undefined,
    result: Omit<SepayTransactionSyncResult, 'backgroundJobRunId'>,
  ): Promise<void> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const finishedAt = new Date()
      await repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.SUCCEEDED,
        finishedAt,
        resultSummary: result,
      })
      if (adminId) {
        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.BANK_TRANSFER_TRANSACTION.SYNC_FROM_SEPAY,
          resourceType: RESOURCE_TYPES.BANK_TRANSFER_TRANSACTION,
          resourceId: String(backgroundJobRunId),
          status: AuditStatus.SUCCESS,
          afterData: result,
        })
      }
    })
  }

  private async failExecution(backgroundJobRunId: number, adminId: number | undefined, error: unknown): Promise<void> {
    const errorMessage = this.getSafeErrorMessage(error)
    await this.unitOfWork.executeInTransaction(async (repos) => {
      await repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.FAILED,
        finishedAt: new Date(),
        errorCode: 'SEPAY_TRANSACTION_SYNC_FAILED',
        errorMessage,
      })
      await repos.sepayTransactionSyncCursorRepository.upsert({
        scope: SEPAY_SYNC_CURSOR_SCOPE,
        lastErrorAt: new Date(),
        lastErrorMessage: errorMessage,
      })
      if (adminId) {
        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.BANK_TRANSFER_TRANSACTION.SYNC_FROM_SEPAY,
          resourceType: RESOURCE_TYPES.BANK_TRANSFER_TRANSACTION,
          resourceId: String(backgroundJobRunId),
          status: AuditStatus.FAIL,
          errorMessage,
        })
      }
    })
  }

  private nextScheduledAt(latestScheduledAt: Date | undefined, now: Date): Date {
    const scheduledAt = new Date(now)
    scheduledAt.setMilliseconds(0)
    if (latestScheduledAt && latestScheduledAt >= scheduledAt) {
      return new Date(latestScheduledAt.getTime() + 1000)
    }
    return scheduledAt
  }

  private getSafeErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định khi đồng bộ giao dịch SePay'
    return message.slice(0, 1000)
  }
}
