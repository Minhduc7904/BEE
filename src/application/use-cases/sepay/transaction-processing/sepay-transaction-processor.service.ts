import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import {
  BankTransferProcessingStatus,
  BankTransferProvider,
  BankTransferReconciliationStatus,
  PaymentAttemptStatus,
  PaymentConfirmationMode,
  PaymentIntentStatus,
  TuitionPaymentStatus,
} from 'src/shared/enums'
import { extractPaymentInstructionReference } from './payment-instruction-reference.util'
import type {
  IncomingSepayTransaction,
  PaymentInstructionReference,
  ProcessSepayTransactionResult,
} from './sepay-transaction-processing.types'

@Injectable()
export class SepayTransactionProcessorService {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async process(input: IncomingSepayTransaction): Promise<ProcessSepayTransactionResult> {
    return this.unitOfWork.executeInTransaction(
      (repos) => this.processInTransaction(repos, input),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async processInTransaction(
    repos: UnitOfWorkRepos,
    input: IncomingSepayTransaction,
  ): Promise<ProcessSepayTransactionResult> {
    const existing = await this.findExistingTransaction(repos, input)
    const receivingBankAccount = await this.resolveReceivingBankAccount(repos, input)
    if (existing) {
      if ((existing.receivingBankAccountId === null || existing.receivingBankAccountId === undefined) && receivingBankAccount) {
        await repos.bankTransferTransactionRepository.updateReceivingBankAccountId(
          existing.bankTransferTransactionId,
          receivingBankAccount.receivingBankAccountId,
        )
      }
      if (input.sepayV2TransactionId && !existing.sepayV2TransactionId) {
        await repos.bankTransferTransactionRepository.updateSepayV2TransactionId(
          existing.bankTransferTransactionId,
          input.sepayV2TransactionId,
        )
      }
      return { duplicate: true, processingStatus: existing.processingStatus }
    }

    const paymentInstruction = extractPaymentInstructionReference(input.content)
    const payloadCode = input.code?.trim().toUpperCase()
    const hasMismatchedPaymentCode = Boolean(
      paymentInstruction && payloadCode && payloadCode !== paymentInstruction.attemptCode,
    )
    const attemptCode = paymentInstruction?.attemptCode ?? payloadCode
    const attempt =
      attemptCode && !hasMismatchedPaymentCode
        ? await repos.paymentAttemptRepository.findByAttemptCode(attemptCode)
        : null
    const processingStatus = await this.resolveProcessingStatus(
      repos,
      input,
      attempt,
      paymentInstruction,
      receivingBankAccount?.receivingBankAccountId ?? null,
    )
    const transaction = await repos.bankTransferTransactionRepository.create({
      provider: BankTransferProvider.SEPAY,
      providerTransactionId: input.providerTransactionId,
      sepayV2TransactionId: input.sepayV2TransactionId,
      paymentAttemptId: attempt?.paymentAttemptId ?? null,
      receivingBankAccountId: receivingBankAccount?.receivingBankAccountId ?? null,
      amount: input.transferAmount,
      transactionAt: input.transactionAt,
      receivingAccountNumber: input.receivingAccountNumber,
      content: input.content ?? null,
      reference: input.reference ?? null,
      rawPayload: input.rawPayload,
      processingStatus,
    })

    if (processingStatus !== BankTransferProcessingStatus.RECEIVED || !attempt) {
      return { duplicate: false, processingStatus: transaction.processingStatus }
    }

    return this.confirmMatchedTuitionPayment(repos, transaction.bankTransferTransactionId, input, attempt, paymentInstruction)
  }

  private async findExistingTransaction(
    repos: UnitOfWorkRepos,
    input: IncomingSepayTransaction,
  ) {
    if (input.sepayV2TransactionId) {
      const existingByV2Id = await repos.bankTransferTransactionRepository.findBySepayV2TransactionId(
        input.sepayV2TransactionId,
      )
      if (existingByV2Id) return existingByV2Id
    }

    const existingByProviderId = await repos.bankTransferTransactionRepository.findByProviderTransactionId(
      BankTransferProvider.SEPAY,
      input.providerTransactionId,
    )
    if (existingByProviderId) return existingByProviderId

    if (!input.reference) return null
    const candidates = await repos.bankTransferTransactionRepository.findAllByProviderReferenceAndMatchCriteria({
      provider: BankTransferProvider.SEPAY,
      reference: input.reference,
      amount: input.transferAmount,
      receivingAccountNumber: input.receivingAccountNumber,
    })
    return candidates.length === 1 ? candidates[0] : null
  }

  private async confirmMatchedTuitionPayment(
    repos: UnitOfWorkRepos,
    bankTransferTransactionId: number,
    input: IncomingSepayTransaction,
    attempt: import('src/domain/entities/tuition-online-payment').PaymentAttempt,
    paymentInstruction: PaymentInstructionReference | null,
  ): Promise<ProcessSepayTransactionResult> {
    const paymentIntent = await repos.paymentIntentRepository.findById(attempt.paymentIntentId)
    if (!paymentIntent) {
      await repos.bankTransferTransactionRepository.updateReconciliation(bankTransferTransactionId, {
        processingStatus: BankTransferProcessingStatus.UNMATCHED,
      })
      return { duplicate: false, processingStatus: BankTransferProcessingStatus.UNMATCHED }
    }

    const tuitionPayment = await repos.tuitionPaymentRepository.findById(paymentIntent.tuitionPaymentId)
    const paymentIntentExpired = paymentIntent.isExpired()
    if (paymentIntentExpired && paymentIntent.status === PaymentIntentStatus.PENDING) {
      await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, { status: PaymentIntentStatus.EXPIRED })
    }
    if (
      !tuitionPayment ||
      tuitionPayment.status !== TuitionPaymentStatus.UNPAID ||
      paymentIntent.status !== PaymentIntentStatus.PENDING ||
      paymentIntentExpired ||
      (paymentInstruction && paymentInstruction.tuitionPaymentId !== paymentIntent.tuitionPaymentId)
    ) {
      await repos.bankTransferTransactionRepository.updateReconciliation(bankTransferTransactionId, {
        processingStatus: BankTransferProcessingStatus.IGNORED,
      })
      return { duplicate: false, processingStatus: BankTransferProcessingStatus.IGNORED }
    }

    await repos.paymentAttemptRepository.update(attempt.paymentAttemptId, { status: PaymentAttemptStatus.SUCCEEDED })
    const updatedPaymentIntent = await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
      status: PaymentIntentStatus.PAID,
    })
    const updatedTuitionPayment = await repos.tuitionPaymentRepository.update(tuitionPayment.paymentId, {
      status: TuitionPaymentStatus.PAID,
      paidAt: input.transactionAt,
    })
    await repos.bankTransferTransactionRepository.updateReconciliation(bankTransferTransactionId, {
      paymentAttemptId: attempt.paymentAttemptId,
      processingStatus: BankTransferProcessingStatus.MATCHED,
      reconciliationStatus: BankTransferReconciliationStatus.AUTOMATIC,
    })
    const student = updatedTuitionPayment
      ? await repos.studentRepository.findById(updatedTuitionPayment.studentId)
      : null
    return {
      duplicate: false,
      processingStatus: BankTransferProcessingStatus.MATCHED,
      paymentId: updatedTuitionPayment?.paymentId,
      studentUserId: student?.userId,
      paymentIntentId: paymentIntent.paymentIntentId,
      tuitionPaymentStatus: updatedTuitionPayment?.status,
      intentStatus: PaymentIntentStatus.PAID,
      paidAt: updatedTuitionPayment?.paidAt ?? null,
      intentUpdatedAt: updatedPaymentIntent.updatedAt,
    }
  }

  private async resolveProcessingStatus(
    repos: UnitOfWorkRepos,
    input: IncomingSepayTransaction,
    attempt: import('src/domain/entities/tuition-online-payment').PaymentAttempt | null,
    paymentInstruction: PaymentInstructionReference | null,
    receivingBankAccountId: number | null,
  ): Promise<BankTransferProcessingStatus> {
    if (input.transferType.toLowerCase() !== 'in') return BankTransferProcessingStatus.IGNORED
    if (!attempt) return BankTransferProcessingStatus.UNMATCHED

    if (paymentInstruction) {
      const paymentIntent = await repos.paymentIntentRepository.findById(attempt.paymentIntentId)
      if (!paymentIntent || paymentIntent.tuitionPaymentId !== paymentInstruction.tuitionPaymentId) {
        return BankTransferProcessingStatus.UNMATCHED
      }
    }
    if (
      attempt.confirmationMode !== PaymentConfirmationMode.AUTOMATIC ||
      attempt.status !== PaymentAttemptStatus.PENDING ||
      attempt.isExpired()
    ) {
      return BankTransferProcessingStatus.IGNORED
    }
    if (receivingBankAccountId === null || attempt.receivingBankAccountId !== receivingBankAccountId) {
      return BankTransferProcessingStatus.UNMATCHED
    }
    return attempt.amount === input.transferAmount
      ? BankTransferProcessingStatus.RECEIVED
      : BankTransferProcessingStatus.AMOUNT_MISMATCH
  }

  private async resolveReceivingBankAccount(repos: UnitOfWorkRepos, input: IncomingSepayTransaction) {
    if (input.transferType.toLowerCase() !== 'in') return null
    const accounts = await repos.receivingBankAccountRepository.findAllByAccountNumber(input.receivingAccountNumber)
    return accounts.length === 1 ? accounts[0] : null
  }
}
