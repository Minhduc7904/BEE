import { Inject, Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'

import { BaseResponseDto, PaymentInstructionResponseDto } from '../../dtos'
import { SepayService } from '../../interfaces'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import type { PaymentAttempt, ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import type { TuitionPayment } from '../../../domain/entities/tuition-payment'
import {
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
  PaymentIntentStatus,
  TuitionCollectionMode,
} from '../../../shared/enums'
import {
  BusinessLogicException,
  InvalidStateException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { TuitionPaymentIntentEligibility } from '../payment-intent/tuition-payment-intent-eligibility'

type ResolvedBankAccount = {
  bankAccount: ReceivingBankAccount
  bankSelectionSource: PaymentBankSelectionSource
  confirmationMode: PaymentConfirmationMode
}

const PAYMENT_ATTEMPT_RENEWAL_THRESHOLD_MS = 60 * 1000
const EXPIRED_ATTEMPT_OFFSET_MS = 1000

type GetPaymentInstructionsOptions = {
  forceRefresh?: boolean
}

@Injectable()
export class GetMyTuitionPaymentInstructionsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly sepayService: SepayService,
  ) {}

  async execute(
    tuitionPaymentId: number,
    studentId: number,
    options: GetPaymentInstructionsOptions = {},
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      this.assertOwnership(tuitionPayment, tuitionPaymentId, studentId)
      TuitionPaymentIntentEligibility.assertPayable(tuitionPayment)

      const existingPaymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPayment.paymentId)
      const now = new Date()
      if (existingPaymentIntent && existingPaymentIntent.status !== PaymentIntentStatus.PENDING) {
        throw new InvalidStateException('Yêu cầu thanh toán này không còn ở trạng thái chờ thanh toán')
      }
      if (existingPaymentIntent?.isExpired(now)) {
        await repos.paymentIntentRepository.update(existingPaymentIntent.paymentIntentId, {
          status: PaymentIntentStatus.EXPIRED,
        })
        throw new InvalidStateException('Yêu cầu thanh toán này đã hết hạn')
      }

      const latestPendingAttempt = existingPaymentIntent
        ? await repos.paymentAttemptRepository.findLatestPendingByPaymentIntent(existingPaymentIntent.paymentIntentId)
        : null
      if (!options.forceRefresh && latestPendingAttempt && this.isReusableAttempt(latestPendingAttempt, now)) {
        const bankAccount = await repos.receivingBankAccountRepository.findById(
          latestPendingAttempt.receivingBankAccountId,
        )
        if (!bankAccount) {
          throw new NotFoundException('Không tìm thấy tài khoản nhận tiền của giao dịch đang chờ')
        }

        const transferContent = this.createTransferContent(tuitionPayment, latestPendingAttempt.attemptCode)
        const qrCodeUrl = this.createVietQrUrl(bankAccount, latestPendingAttempt.amount, transferContent)
        const paymentAttempt = latestPendingAttempt.qrCodeUrl === qrCodeUrl
          ? latestPendingAttempt
          : await repos.paymentAttemptRepository.update(latestPendingAttempt.paymentAttemptId, { qrCodeUrl })
        return this.toResponse(tuitionPayment, paymentAttempt, bankAccount, transferContent)
      }

      const pendingAttempts = existingPaymentIntent
        ? await repos.paymentAttemptRepository.findAll({
            paymentIntentId: existingPaymentIntent.paymentIntentId,
            status: PaymentAttemptStatus.PENDING,
          })
        : []
      for (const pendingAttempt of pendingAttempts) {
        await repos.paymentAttemptRepository.update(pendingAttempt.paymentAttemptId, {
          status: PaymentAttemptStatus.EXPIRED,
          expiresAt: this.getExpiredAttemptTime(now),
        })
      }

      const selection = await this.resolveReceivingBankAccount(repos, tuitionPayment)
      const paymentIntent = existingPaymentIntent ?? await this.createPaymentIntent(repos, tuitionPayment)
      const attemptCode = this.createAttemptCode()
      const transferContent = this.createTransferContent(tuitionPayment, attemptCode)
      const paymentAttempt = await repos.paymentAttemptRepository.create({
        paymentIntentId: paymentIntent.paymentIntentId,
        attemptCode,
        receivingBankAccountId: selection.bankAccount.receivingBankAccountId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        bankSelectionSource: selection.bankSelectionSource,
        confirmationMode: selection.confirmationMode,
        qrCodeUrl: this.createVietQrUrl(selection.bankAccount, paymentIntent.amount, transferContent),
        expiresAt: this.sepayService.getAttemptExpiry(),
      })

      return this.toResponse(tuitionPayment, paymentAttempt, selection.bankAccount, transferContent)
    })

    return BaseResponseDto.success('Lấy hướng dẫn thanh toán học phí thành công', response)
  }

  private async createPaymentIntent(repos: UnitOfWorkRepos, tuitionPayment: TuitionPayment) {
    return repos.paymentIntentRepository.create({
      tuitionPaymentId: tuitionPayment.paymentId,
      amount: tuitionPayment.amount!,
      currency: 'VND',
      expiresAt: null,
    })
  }

  private async resolveReceivingBankAccount(
    repos: UnitOfWorkRepos,
    tuitionPayment: TuitionPayment,
  ): Promise<ResolvedBankAccount> {
    const configuration = await repos.tuitionCollectionConfigurationRepository.findCurrent()
    if (!configuration) {
      throw new NotFoundException('Chưa có cấu hình thu học phí')
    }

    const defaultManualAccount = await repos.receivingBankAccountRepository.findById(
      configuration.defaultManualReceivingBankAccountId,
    )
    if (!defaultManualAccount || !defaultManualAccount.isAvailableForManualCollection()) {
      throw new BusinessLogicException('Tài khoản nhận tiền thủ công mặc định chưa sẵn sàng')
    }

    if (configuration.collectionMode === TuitionCollectionMode.MANUAL_FALLBACK) {
      return {
        bankAccount: defaultManualAccount,
        bankSelectionSource: PaymentBankSelectionSource.MANUAL_DEFAULT,
        confirmationMode: PaymentConfirmationMode.MANUAL_FALLBACK,
      }
    }

    const grade = tuitionPayment.student?.grade
    const gradeMapping = grade === undefined
      ? null
      : await repos.tuitionGradeReceivingBankAccountRepository.findByGrade(grade)
    const automaticBankAccount = gradeMapping?.receivingBankAccountId
      ? await repos.receivingBankAccountRepository.findById(gradeMapping.receivingBankAccountId)
      : null

    if (automaticBankAccount?.isAvailableForAutomaticCollection()) {
      return {
        bankAccount: automaticBankAccount,
        bankSelectionSource: PaymentBankSelectionSource.GRADE_MAPPING,
        confirmationMode: PaymentConfirmationMode.AUTOMATIC,
      }
    }

    return {
      bankAccount: defaultManualAccount,
      bankSelectionSource: PaymentBankSelectionSource.MANUAL_DEFAULT,
      confirmationMode: PaymentConfirmationMode.MANUAL_FALLBACK,
    }
  }

  private assertOwnership(
    tuitionPayment: TuitionPayment | null,
    tuitionPaymentId: number,
    studentId: number,
  ): asserts tuitionPayment is TuitionPayment {
    if (!tuitionPayment || tuitionPayment.studentId !== studentId) {
      throw new NotFoundException(`Không tìm thấy học phí với ID ${tuitionPaymentId}`)
    }
  }

  private isReusableAttempt(paymentAttempt: PaymentAttempt, now: Date): boolean {
    if (!paymentAttempt.isPending() || paymentAttempt.isExpired(now)) {
      return false
    }

    return paymentAttempt.expiresAt.getTime() - now.getTime() >= PAYMENT_ATTEMPT_RENEWAL_THRESHOLD_MS
  }

  private getExpiredAttemptTime(now: Date): Date {
    return new Date(now.getTime() - EXPIRED_ATTEMPT_OFFSET_MS)
  }

  private createAttemptCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return `HP${Array.from(randomBytes(5), (byte) => alphabet[byte % alphabet.length]).join('')}`
  }

  private createTransferContent(tuitionPayment: TuitionPayment, attemptCode: string): string {
    const parts = [attemptCode, `TP${tuitionPayment.paymentId}`]
    const student = tuitionPayment.student?.user
    const studentName = student ? `${student.lastName} ${student.firstName}`.trim() : null
    if (studentName) {
      parts.push(`HS${this.normalizeTransferText(studentName).slice(0, 60)}`)
    }

    const parentPhone = tuitionPayment.student?.parentPhone?.replace(/\D/g, '')
    if (parentPhone) {
      parts.push(parentPhone)
    }

    return parts.join(' ')
  }

  private toResponse(
    tuitionPayment: TuitionPayment,
    paymentAttempt: PaymentAttempt,
    bankAccount: ReceivingBankAccount,
    transferContent = this.createTransferContent(tuitionPayment, paymentAttempt.attemptCode),
  ): PaymentInstructionResponseDto {
    return PaymentInstructionResponseDto.fromPaymentAttempt(
      tuitionPayment.paymentId,
      paymentAttempt,
      {
        receivingBankAccountId: bankAccount.receivingBankAccountId,
        bankCode: bankAccount.bankCode,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
        displayName: bankAccount.displayName,
      },
      transferContent,
    )
  }

  private createVietQrUrl(
    bankAccount: ReceivingBankAccount,
    amount: number,
    transferContent: string,
  ): string {
    return this.sepayService.createVietQrUrl({
      bankCode: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      amount,
      description: transferContent,
    })
  }

  private normalizeTransferText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
