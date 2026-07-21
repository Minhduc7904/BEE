import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'
import { BaseResponseDto, ConfirmManualTuitionPaymentDto, TuitionPaymentResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories/unit-of-work.repository'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import {
  AuditStatus,
  BankTransferProcessingStatus,
  BankTransferReconciliationStatus,
  NotificationLevel,
  NotificationType,
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
  PaymentIntentStatus,
  TuitionPaymentStatus,
} from 'src/shared/enums'
import {
  BusinessLogicException,
  InvalidStateException,
  NotFoundException,
  UnauthorizedException,
} from 'src/shared/exceptions/custom-exceptions'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { CreatePaymentIntentForCreatedTuitionPayment } from '../payment-intent/create-payment-intent-for-created-tuition-payment'
import { SendTuitionPaymentToParentUseCase } from './send-tuition-payment-to-parent.use-case'
import { TuitionPaymentIntentRealtimeService } from 'src/application/interfaces'

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
export class ConfirmManualTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
    private readonly sendTuitionPaymentToParentUseCase: SendTuitionPaymentToParentUseCase,
    private readonly tuitionPaymentIntentRealtimeService: TuitionPaymentIntentRealtimeService,
  ) {}

  async execute(
    tuitionPaymentId: number,
    dto: ConfirmManualTuitionPaymentDto,
    adminId?: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    if (!adminId) {
      throw new UnauthorizedException('Admin không hợp lệ')
    }

    const result = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
        if (!tuitionPayment) {
          throw new NotFoundException(`Học phí với ID ${tuitionPaymentId} không tồn tại`)
        }

        if (tuitionPayment.status !== TuitionPaymentStatus.UNPAID) {
          throw new InvalidStateException('Chỉ có thể xác nhận thủ công học phí chưa thanh toán')
        }

        const beforePaymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
        const currentPaymentIntent =
          beforePaymentIntent ?? (await CreatePaymentIntentForCreatedTuitionPayment.execute(repos, tuitionPayment))
        const bankTransferTransactionIds = this.normalizeBankTransferTransactionIds(dto.bankTransferTransactionIds)
        const reconciliation =
          bankTransferTransactionIds.length > 0
            ? await this.reconcileBankTransferTransactions(
                repos,
                tuitionPayment,
                currentPaymentIntent,
                bankTransferTransactionIds,
              )
            : null
        const paidAt = dto.paidAt ? new Date(dto.paidAt) : (reconciliation?.latestTransactionAt ?? new Date())
        const updatedTuitionPayment = await repos.tuitionPaymentRepository.update(tuitionPaymentId, {
          status: TuitionPaymentStatus.PAID,
          paidAt,
          notes: this.appendManualConfirmationNote(tuitionPayment.notes, dto),
        })
        if (!updatedTuitionPayment) {
          throw new NotFoundException(`Cập nhật học phí thất bại, không tìm thấy học phí với ID ${tuitionPaymentId}`)
        }

        const paymentIntent = reconciliation?.paymentIntent ?? currentPaymentIntent
        const updatedPaymentIntent =
          paymentIntent.status !== PaymentIntentStatus.PAID
            ? await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
                status: PaymentIntentStatus.PAID,
              })
            : paymentIntent

        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_PAYMENT.CONFIRM_MANUAL_PAYMENT,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
          resourceId: updatedTuitionPayment.paymentId.toString(),
          beforeData: {
            tuitionPayment: {
              paymentId: tuitionPayment.paymentId,
              status: tuitionPayment.status,
              paidAt: tuitionPayment.paidAt,
              notes: tuitionPayment.notes,
            },
            paymentIntent: beforePaymentIntent
              ? {
                  paymentIntentId: beforePaymentIntent.paymentIntentId,
                  status: beforePaymentIntent.status,
                }
              : null,
            bankTransferTransactions: reconciliation?.beforeTransactions ?? [],
          },
          afterData: {
            tuitionPayment: {
              paymentId: updatedTuitionPayment.paymentId,
              status: updatedTuitionPayment.status,
              paidAt: updatedTuitionPayment.paidAt,
              notes: updatedTuitionPayment.notes,
            },
            paymentIntent: {
              paymentIntentId: updatedPaymentIntent.paymentIntentId,
              status: updatedPaymentIntent.status,
            },
            paymentAttempts: reconciliation?.paymentAttempts ?? [],
            bankTransferTransactions: reconciliation?.updatedTransactions ?? [],
            bankTransferTransactionIds,
            reference: dto.reference,
            reason: dto.reason,
            amountVerification: 'SKIPPED_BY_MANUAL_RECONCILIATION_POLICY',
          },
        })

        const student = await repos.studentRepository.findById(updatedTuitionPayment.studentId)
        return {
          response: new TuitionPaymentResponseDto(updatedTuitionPayment),
          paymentId: updatedTuitionPayment.paymentId,
          studentUserId: student?.userId,
          paymentIntentId: updatedPaymentIntent.paymentIntentId,
          paidAt: updatedTuitionPayment.paidAt ?? null,
          intentUpdatedAt: updatedPaymentIntent.updatedAt,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    this.tuitionPaymentIntentRealtimeService.notifyIntentPaid({
      paymentIntentId: result.paymentIntentId,
      tuitionPaymentId: result.paymentId,
      tuitionPaymentStatus: result.response.status,
      intentStatus: PaymentIntentStatus.PAID,
      paidAt: result.paidAt,
      intentUpdatedAt: result.intentUpdatedAt,
    })

    if (result.studentUserId) {
      this.createAndNotifyOne
        .execute({
          userId: result.studentUserId,
          title: 'Xác nhận đã thu học phí',
          message: `Học phí tháng ${result.response.month}/${result.response.year} đã được xác nhận thanh toán - Số tiền: ${result.response.amount?.toLocaleString('vi-VN')}đ`,
          type: NotificationType.TUITION,
          level: NotificationLevel.SUCCESS,
          data: {
            paymentId: result.response.paymentId,
            amount: result.response.amount,
            month: result.response.month,
            year: result.response.year,
            status: result.response.status,
            shouldShowReminderModal: true,
          },
        })
        .catch(() => {
          /* ignore notification error */
        })
    }

    await this.sendTuitionPaymentToParentUseCase.execute({ paymentId: result.paymentId }).catch(() => {
      /* ignore parent notification error */
    })

    return BaseResponseDto.success('Xác nhận thanh toán học phí thủ công thành công', result.response)
  }

  private normalizeBankTransferTransactionIds(bankTransferTransactionIds?: number[]): number[] {
    if (!bankTransferTransactionIds) {
      return []
    }

    if (bankTransferTransactionIds.length === 0) {
      throw new BusinessLogicException('Danh sách giao dịch ngân hàng không được rỗng')
    }

    if (new Set(bankTransferTransactionIds).size !== bankTransferTransactionIds.length) {
      throw new BusinessLogicException('Danh sách giao dịch ngân hàng không được chứa ID trùng lặp')
    }

    return bankTransferTransactionIds
  }

  private appendManualConfirmationNote(
    currentNotes: string | null | undefined,
    dto: ConfirmManualTuitionPaymentDto,
  ): string {
    const evidence = [
      dto.bankTransferTransactionIds?.length
        ? `Giao dịch ngân hàng: ${dto.bankTransferTransactionIds.join(', ')}`
        : null,
      dto.reference ? `Mã tham chiếu: ${dto.reference}` : null,
      dto.reason ? `Lý do: ${dto.reason}` : null,
    ].filter((value): value is string => value !== null)
    const manualNote = ['Đã xác nhận chuyển khoản thủ công', ...evidence].join(' | ')
    return currentNotes ? `${currentNotes}\n${manualNote}` : manualNote
  }

  private async reconcileBankTransferTransactions(
    repos: import('src/domain/repositories').UnitOfWorkRepos,
    tuitionPayment: import('src/domain/entities/tuition-payment').TuitionPayment,
    paymentIntent: import('src/domain/entities/tuition-online-payment').PaymentIntent,
    bankTransferTransactionIds: number[],
  ) {
    if (paymentIntent.status !== PaymentIntentStatus.PENDING) {
      throw new InvalidStateException('Payment intent không còn ở trạng thái chờ thanh toán')
    }

    const reconciliations: ManualTransactionReconciliation[] = []
    for (const bankTransferTransactionId of bankTransferTransactionIds) {
      reconciliations.push(
        await this.reconcileBankTransferTransaction(repos, tuitionPayment, paymentIntent, bankTransferTransactionId),
      )
    }

    return {
      paymentIntent,
      paymentAttempts: reconciliations.map((reconciliation) => reconciliation.paymentAttempt),
      latestTransactionAt: reconciliations.reduce(
        (latest, reconciliation) => (reconciliation.transactionAt > latest ? reconciliation.transactionAt : latest),
        reconciliations[0].transactionAt,
      ),
      beforeTransactions: reconciliations.map((reconciliation) => reconciliation.beforeTransaction),
      updatedTransactions: reconciliations.map((reconciliation) => reconciliation.updatedTransaction),
    }
  }

  private async reconcileBankTransferTransaction(
    repos: import('src/domain/repositories').UnitOfWorkRepos,
    tuitionPayment: import('src/domain/entities/tuition-payment').TuitionPayment,
    paymentIntent: import('src/domain/entities/tuition-online-payment').PaymentIntent,
    bankTransferTransactionId: number,
  ): Promise<ManualTransactionReconciliation> {
    const transaction = await repos.bankTransferTransactionRepository.findById(bankTransferTransactionId)
    if (!transaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch ngân hàng với ID ${bankTransferTransactionId}`)
    }

    if (transaction.reconciliationStatus !== BankTransferReconciliationStatus.UNRECONCILED) {
      throw new InvalidStateException('Giao dịch ngân hàng này đã được đối soát')
    }

    let paymentAttempt: import('src/domain/entities/tuition-online-payment').PaymentAttempt
    if (transaction.paymentAttemptId) {
      const existingAttempt = await repos.paymentAttemptRepository.findById(transaction.paymentAttemptId)
      if (
        !existingAttempt ||
        existingAttempt.paymentIntentId !== paymentIntent.paymentIntentId ||
        existingAttempt.confirmationMode !== PaymentConfirmationMode.MANUAL_FALLBACK ||
        ![PaymentAttemptStatus.PENDING, PaymentAttemptStatus.SUCCEEDED].includes(existingAttempt.status)
      ) {
        throw new InvalidStateException('Giao dịch ngân hàng không thể được xác nhận thủ công cho học phí này')
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
          // Attempt này chỉ lưu lịch sử đối soát, không phát QR còn hiệu lực.
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
    repos: import('src/domain/repositories').UnitOfWorkRepos,
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
