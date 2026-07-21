import { Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'

import type { BankTransferTransaction, PaymentIntent } from '../../../domain/entities/tuition-online-payment'
import type { UnitOfWorkRepos } from '../../../domain/repositories'
import {
  BankTransferProcessingStatus,
  BankTransferReconciliationStatus,
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
  PaymentIntentStatus,
} from '../../../shared/enums'
import {
  BusinessLogicException,
  InvalidStateException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'

type ManualTransactionReconciliation = {
  paymentAttempt: {
    paymentAttemptId: number
    status: PaymentAttemptStatus
    confirmationMode: PaymentConfirmationMode
  }
  transactionAt: Date
  beforeTransaction: {
    bankTransferTransactionId: number
    paymentAttemptId: number | null | undefined
    processingStatus: BankTransferProcessingStatus
    reconciliationStatus: BankTransferReconciliationStatus
  }
  updatedTransaction: {
    bankTransferTransactionId: number
    paymentAttemptId: number | null | undefined
    processingStatus: BankTransferProcessingStatus
    reconciliationStatus: BankTransferReconciliationStatus
  }
}

@Injectable()
export class ManualTuitionPaymentReconciliationService {
  normalizeBankTransferTransactionIds(bankTransferTransactionIds: number[]): number[] {
    if (bankTransferTransactionIds.length === 0) {
      throw new BusinessLogicException('Danh sách giao dịch ngân hàng không được rỗng')
    }

    if (new Set(bankTransferTransactionIds).size !== bankTransferTransactionIds.length) {
      throw new BusinessLogicException('Danh sách giao dịch ngân hàng không được chứa ID trùng lặp')
    }

    return bankTransferTransactionIds
  }

  async reconcileBankTransferTransactions(
    repos: UnitOfWorkRepos,
    paymentIntent: PaymentIntent,
    bankTransferTransactionIds: number[],
  ) {
    if (paymentIntent.status !== PaymentIntentStatus.PENDING) {
      throw new InvalidStateException('Payment intent không còn ở trạng thái chờ thanh toán')
    }

    const reconciliations: ManualTransactionReconciliation[] = []
    for (const bankTransferTransactionId of bankTransferTransactionIds) {
      reconciliations.push(await this.reconcileBankTransferTransaction(repos, paymentIntent, bankTransferTransactionId))
    }

    return {
      paymentAttempts: reconciliations.map((reconciliation) => reconciliation.paymentAttempt),
      latestTransactionAt: reconciliations.reduce(
        (latest, reconciliation) => (reconciliation.transactionAt > latest ? reconciliation.transactionAt : latest),
        reconciliations[0].transactionAt,
      ),
      beforeTransactions: reconciliations.map((reconciliation) => reconciliation.beforeTransaction),
      updatedTransactions: reconciliations.map((reconciliation) => reconciliation.updatedTransaction),
    }
  }

  async releaseBankTransferTransactions(
    repos: UnitOfWorkRepos,
    paymentIntentId: number,
    retainedTransactionIds: number[] = [],
  ) {
    const paymentAttempts = await repos.paymentAttemptRepository.findAll({ paymentIntentId })
    if (paymentAttempts.length === 0) return []

    const retainedTransactionIdSet = new Set(retainedTransactionIds)
    const bankTransferTransactions = await repos.bankTransferTransactionRepository.findAll({
      paymentAttemptIds: paymentAttempts.map((paymentAttempt) => paymentAttempt.paymentAttemptId),
    })
    const releasedTransactions: BankTransferTransaction[] = []

    for (const bankTransferTransaction of bankTransferTransactions) {
      if (retainedTransactionIdSet.has(bankTransferTransaction.bankTransferTransactionId)) continue

      releasedTransactions.push(
        await repos.bankTransferTransactionRepository.updateReconciliation(
          bankTransferTransaction.bankTransferTransactionId,
          {
            paymentAttemptId: null,
            processingStatus: BankTransferProcessingStatus.RECEIVED,
            reconciliationStatus: BankTransferReconciliationStatus.UNRECONCILED,
          },
        ),
      )
    }

    const retainedAttemptIds = new Set(
      bankTransferTransactions
        .filter((transaction) => retainedTransactionIdSet.has(transaction.bankTransferTransactionId))
        .map((transaction) => transaction.paymentAttemptId)
        .filter(
          (paymentAttemptId): paymentAttemptId is number => paymentAttemptId !== null && paymentAttemptId !== undefined,
        ),
    )
    const now = new Date()
    for (const paymentAttempt of paymentAttempts) {
      if (
        retainedAttemptIds.has(paymentAttempt.paymentAttemptId) ||
        paymentAttempt.status !== PaymentAttemptStatus.SUCCEEDED
      ) {
        continue
      }

      await repos.paymentAttemptRepository.update(paymentAttempt.paymentAttemptId, {
        status: paymentAttempt.isExpired(now) ? PaymentAttemptStatus.EXPIRED : PaymentAttemptStatus.PENDING,
      })
    }

    return releasedTransactions
  }

  private async reconcileBankTransferTransaction(
    repos: UnitOfWorkRepos,
    paymentIntent: PaymentIntent,
    bankTransferTransactionId: number,
  ): Promise<ManualTransactionReconciliation> {
    const transaction = await repos.bankTransferTransactionRepository.findById(bankTransferTransactionId)
    if (!transaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch ngân hàng với ID ${bankTransferTransactionId}`)
    }

    if (transaction.reconciliationStatus !== BankTransferReconciliationStatus.UNRECONCILED) {
      throw new InvalidStateException('Giao dịch ngân hàng này đã được đối soát')
    }

    let paymentAttempt
    if (transaction.paymentAttemptId) {
      const existingAttempt = await repos.paymentAttemptRepository.findById(transaction.paymentAttemptId)
      if (
        !existingAttempt ||
        existingAttempt.paymentIntentId !== paymentIntent.paymentIntentId ||
        existingAttempt.confirmationMode !== PaymentConfirmationMode.MANUAL_FALLBACK ||
        ![PaymentAttemptStatus.PENDING, PaymentAttemptStatus.SUCCEEDED].includes(existingAttempt.status) ||
        existingAttempt.isExpired()
      ) {
        throw new InvalidStateException('Giao dịch ngân hàng không thể được đối soát thủ công cho học phí này')
      }

      paymentAttempt =
        existingAttempt.status === PaymentAttemptStatus.PENDING
          ? await repos.paymentAttemptRepository.update(existingAttempt.paymentAttemptId, {
              status: PaymentAttemptStatus.SUCCEEDED,
            })
          : existingAttempt
    } else {
      const pendingManualAttempts = await repos.paymentAttemptRepository.findAll({
        paymentIntentId: paymentIntent.paymentIntentId,
        status: PaymentAttemptStatus.PENDING,
        confirmationMode: PaymentConfirmationMode.MANUAL_FALLBACK,
      })
      const pendingAttempt = pendingManualAttempts.find((attempt) => !attempt.isExpired())
      for (const expiredAttempt of pendingManualAttempts.filter((attempt) => attempt.isExpired())) {
        await repos.paymentAttemptRepository.update(expiredAttempt.paymentAttemptId, {
          status: PaymentAttemptStatus.EXPIRED,
        })
      }

      if (pendingAttempt) {
        paymentAttempt = await repos.paymentAttemptRepository.update(pendingAttempt.paymentAttemptId, {
          status: PaymentAttemptStatus.SUCCEEDED,
        })
      } else {
        const receivingBankAccount = await this.findReceivingBankAccountForTransaction(
          repos,
          transaction.receivingBankAccountId,
          transaction.receivingAccountNumber,
        )
        paymentAttempt = await repos.paymentAttemptRepository.create({
          paymentIntentId: paymentIntent.paymentIntentId,
          attemptCode: this.createManualAttemptCode(),
          receivingBankAccountId: receivingBankAccount.receivingBankAccountId,
          amount: transaction.amount,
          currency: paymentIntent.currency,
          bankSelectionSource: PaymentBankSelectionSource.MANUAL_DEFAULT,
          confirmationMode: PaymentConfirmationMode.MANUAL_FALLBACK,
          status: PaymentAttemptStatus.SUCCEEDED,
          expiresAt: transaction.transactionAt,
        })
      }
    }

    const updatedTransaction = await repos.bankTransferTransactionRepository.updateReconciliation(
      transaction.bankTransferTransactionId,
      {
        paymentAttemptId: paymentAttempt.paymentAttemptId,
        processingStatus: BankTransferProcessingStatus.MATCHED,
        reconciliationStatus: BankTransferReconciliationStatus.ADMIN,
      },
    )

    return {
      paymentAttempt: {
        paymentAttemptId: paymentAttempt.paymentAttemptId,
        status: paymentAttempt.status,
        confirmationMode: paymentAttempt.confirmationMode,
      },
      transactionAt: transaction.transactionAt,
      beforeTransaction: {
        bankTransferTransactionId: transaction.bankTransferTransactionId,
        paymentAttemptId: transaction.paymentAttemptId,
        processingStatus: transaction.processingStatus,
        reconciliationStatus: transaction.reconciliationStatus,
      },
      updatedTransaction: {
        bankTransferTransactionId: updatedTransaction.bankTransferTransactionId,
        paymentAttemptId: updatedTransaction.paymentAttemptId,
        processingStatus: updatedTransaction.processingStatus,
        reconciliationStatus: updatedTransaction.reconciliationStatus,
      },
    }
  }

  private async findReceivingBankAccountForTransaction(
    repos: UnitOfWorkRepos,
    receivingBankAccountId: number | null | undefined,
    receivingAccountNumber: string | null | undefined,
  ) {
    if (receivingBankAccountId !== null && receivingBankAccountId !== undefined) {
      const linkedAccount = await repos.receivingBankAccountRepository.findById(receivingBankAccountId)
      if (!linkedAccount || !linkedAccount.isAvailableForManualCollection()) {
        throw new BusinessLogicException(
          'Tài khoản nhận đã liên kết với giao dịch không còn dùng được để đối soát thủ công',
        )
      }
      return linkedAccount
    }

    if (!receivingAccountNumber) {
      throw new BusinessLogicException('Giao dịch ngân hàng không có số tài khoản nhận để tạo payment attempt')
    }

    const matchingAccounts = (await repos.receivingBankAccountRepository.findAll()).filter(
      (account) => account.accountNumber === receivingAccountNumber,
    )
    if (matchingAccounts.length !== 1 || !matchingAccounts[0].isAvailableForManualCollection()) {
      throw new BusinessLogicException('Không xác định được tài khoản nhận tiền thủ công đang hoạt động')
    }
    return matchingAccounts[0]
  }

  private createManualAttemptCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return `HP${Array.from(randomBytes(5), (byte) => alphabet[byte % alphabet.length]).join('')}`
  }
}
