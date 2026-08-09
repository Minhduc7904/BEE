import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'
import { BaseResponseDto, CoursePaymentInstructionResponseDto } from '../../dtos'
import { PasswordService, SepayService } from '../../interfaces'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import type { CourseEnrollment } from '../../../domain/entities/course-enrollment'
import type { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import {
  BankTransferTransactionType,
  CourseEnrollmentStatus,
  CourseEnrollmentType,
  CourseType,
  CourseVisibility,
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
  PaymentIntentStatus,
} from '../../../shared/enums'
import { BusinessLogicException } from '../../../shared/exceptions/custom-exceptions'
import type { PublicCoursePaymentCredentialDto } from '../../dtos/course-payment'

const PAYMENT_ATTEMPT_RENEWAL_THRESHOLD_MS = 60 * 1000

@Injectable()
export class CreateCoursePaymentInstructionsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    private readonly sepayService: SepayService,
  ) {}

  async executeForLoggedInUser(
    courseIdOrCode: string,
    userId: number,
    forceRefresh = false,
  ): Promise<BaseResponseDto<CoursePaymentInstructionResponseDto>> {
    return this.executeForUser(courseIdOrCode, userId, forceRefresh)
  }

  async executeWithCredential(
    courseIdOrCode: string,
    dto: PublicCoursePaymentCredentialDto,
    forceRefresh = false,
  ): Promise<BaseResponseDto<CoursePaymentInstructionResponseDto>> {
    const userId = await this.authenticateCredential(dto)
    return this.executeForUser(courseIdOrCode, userId, forceRefresh)
  }

  async authenticateCredential(dto: PublicCoursePaymentCredentialDto): Promise<number> {
    if (Boolean(dto.email) === Boolean(dto.username)) {
      throw new BadRequestException('Cung cấp chính xác một email hoặc tên đăng nhập')
    }
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const found = dto.email
        ? await repos.userRepository.findByEmailWithDetails(dto.email)
        : await repos.userRepository.findByUsernameWithDetails(dto.username!)
      if (!found?.user || !found.student || !found.user.isActive) {
        throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng')
      }
      const valid = await this.passwordService.comparePassword(dto.password, found.user.passwordHash)
      if (!valid) throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng')
      return found.user.userId
    })
  }

  private async executeForUser(
    courseIdOrCode: string,
    userId: number,
    forceRefresh: boolean,
  ): Promise<BaseResponseDto<CoursePaymentInstructionResponseDto>> {
    const data = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const student = await repos.studentRepository.findByUserId(userId)
        if (!student) throw new UnauthorizedException('Chỉ học sinh mới có thể mua khóa học')
        const user = await repos.userRepository.findById(userId)
        const course = await this.findPublicOnlineCourse(repos, courseIdOrCode)
        let enrollment = await repos.courseEnrollmentRepository.findByCourseAndStudent(
          course.courseId,
          student.studentId,
        )

        if (enrollment?.status === CourseEnrollmentStatus.ACTIVE && enrollment.isPaidFull) {
          return this.activeResponse(course.courseId, enrollment)
        }

        if (!enrollment) {
          enrollment = await repos.courseEnrollmentRepository.create({
            courseId: course.courseId,
            studentId: student.studentId,
            status: course.priceVND <= 0 ? CourseEnrollmentStatus.ACTIVE : CourseEnrollmentStatus.BLOCKED_UNPAID,
            type: CourseEnrollmentType.ONLINE_PURCHASE,
            isPaidFull: course.priceVND <= 0,
          })
        }

        if (course.priceVND <= 0) {
          if (
            enrollment.status !== CourseEnrollmentStatus.ACTIVE ||
            !enrollment.isPaidFull ||
            enrollment.type !== CourseEnrollmentType.ONLINE_PURCHASE
          ) {
            enrollment = await repos.courseEnrollmentRepository.update(enrollment.enrollmentId, {
              status: CourseEnrollmentStatus.ACTIVE,
              type: CourseEnrollmentType.ONLINE_PURCHASE,
              isPaidFull: true,
            })
          }
          return this.activeResponse(course.courseId, enrollment, 'FREE')
        }

        if (
          enrollment.status !== CourseEnrollmentStatus.BLOCKED_UNPAID ||
          enrollment.type !== CourseEnrollmentType.ONLINE_PURCHASE
        ) {
          enrollment = await repos.courseEnrollmentRepository.update(enrollment.enrollmentId, {
            status: CourseEnrollmentStatus.BLOCKED_UNPAID,
            type: CourseEnrollmentType.ONLINE_PURCHASE,
            isPaidFull: false,
          })
        }

        const now = new Date()
        let intent = await repos.paymentIntentRepository.findByCourseEnrollmentId(enrollment.enrollmentId)
        if (intent?.status === PaymentIntentStatus.PAID) return this.activeResponse(course.courseId, enrollment)
        if (intent?.isExpired(now)) {
          await repos.paymentIntentRepository.update(intent.paymentIntentId, { status: PaymentIntentStatus.EXPIRED })
          intent = null
        }
        if (!intent) {
          intent = await repos.paymentIntentRepository.create({
            type: BankTransferTransactionType.COURSE_PURCHASE,
            courseEnrollmentId: enrollment.enrollmentId,
            amount: course.priceVND,
            currency: 'VND',
            expiresAt: null,
          })
        }

        const latest = await repos.paymentAttemptRepository.findLatestPendingByPaymentIntent(intent.paymentIntentId)
        const configuration = await repos.coursePaymentConfigurationRepository.findCurrent()
        if (!configuration) throw new NotFoundException('Chưa có cấu hình ngân hàng thanh toán khóa học')
        const bankAccount = await repos.receivingBankAccountRepository.findById(configuration.receivingBankAccountId)
        if (!bankAccount || !bankAccount.isAvailableForManualCollection()) {
          throw new BusinessLogicException('Tài khoản nhận tiền của khóa học chưa sẵn sàng')
        }

        if (
          !forceRefresh &&
          latest &&
          latest.isPending() &&
          !latest.isExpired(now) &&
          latest.expiresAt.getTime() - now.getTime() >= PAYMENT_ATTEMPT_RENEWAL_THRESHOLD_MS
        ) {
          return this.toInstruction(
            course.courseId,
            enrollment.enrollmentId,
            latest,
            bankAccount,
            user,
            student.parentPhone,
          )
        }

        const attempt = await repos.paymentAttemptRepository.create({
          paymentIntentId: intent.paymentIntentId,
          attemptCode: this.createAttemptCode(),
          receivingBankAccountId: bankAccount.receivingBankAccountId,
          amount: intent.amount,
          currency: intent.currency,
          bankSelectionSource: PaymentBankSelectionSource.MANUAL_DEFAULT,
          confirmationMode: bankAccount.isAvailableForAutomaticCollection()
            ? PaymentConfirmationMode.AUTOMATIC
            : PaymentConfirmationMode.MANUAL_FALLBACK,
          expiresAt: this.sepayService.getAttemptExpiry(),
        })
        const qrCodeUrl = this.createVietQrUrl(
          bankAccount,
          attempt.amount,
          this.transferContent(
            enrollment,
            attempt.attemptCode,
            user ? `${user.lastName} ${user.firstName}` : null,
            student.parentPhone,
          ),
        )
        const updatedAttempt = await repos.paymentAttemptRepository.update(attempt.paymentAttemptId, { qrCodeUrl })
        return this.toInstruction(
          course.courseId,
          enrollment.enrollmentId,
          updatedAttempt,
          bankAccount,
          user,
          student.parentPhone,
        )
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
    return BaseResponseDto.success('Lấy hướng dẫn thanh toán khóa học thành công', data)
  }

  private async findPublicOnlineCourse(repos: UnitOfWorkRepos, courseIdOrCode: string) {
    const course = /^\d+$/.test(courseIdOrCode)
      ? await repos.courseRepository.findById(Number(courseIdOrCode))
      : await repos.courseRepository.findByCode(courseIdOrCode)
    if (
      !course ||
      course.visibility !== CourseVisibility.PUBLISHED ||
      course.isEnded ||
      !course.isOnline() ||
      ![CourseType.ONLINE, CourseType.ALL].includes(course.courseType)
    ) {
      throw new NotFoundException('Không tìm thấy khóa học online công khai')
    }
    return course
  }

  private activeResponse(courseId: number, enrollment: CourseEnrollment, status: 'FREE' | 'ACTIVE' = 'ACTIVE') {
    return {
      type: BankTransferTransactionType.COURSE_PURCHASE,
      courseId,
      courseEnrollmentId: enrollment.enrollmentId,
      amount: 0,
      currency: 'VND',
      status,
    }
  }

  private toInstruction(
    courseId: number,
    enrollmentId: number,
    attempt: import('../../../domain/entities/tuition-online-payment').PaymentAttempt,
    bank: ReceivingBankAccount,
    user: { firstName: string; lastName: string } | null,
    parentPhone?: string | null,
  ): CoursePaymentInstructionResponseDto {
    const transferContent = this.transferContent(
      { enrollmentId } as CourseEnrollment,
      attempt.attemptCode,
      user ? `${user.lastName} ${user.firstName}` : null,
      parentPhone,
    )
    return {
      type: BankTransferTransactionType.COURSE_PURCHASE,
      courseId,
      courseEnrollmentId: enrollmentId,
      paymentIntentId: attempt.paymentIntentId,
      paymentAttemptId: attempt.paymentAttemptId,
      attemptCode: attempt.attemptCode,
      amount: attempt.amount,
      currency: attempt.currency,
      transferContent,
      qrCodeUrl: attempt.qrCodeUrl,
      expiresAt: attempt.expiresAt,
      status: attempt.status,
      confirmationMode: attempt.confirmationMode,
      bankSelectionSource: attempt.bankSelectionSource,
      receivingBankAccount: {
        receivingBankAccountId: bank.receivingBankAccountId,
        bankCode: bank.bankCode,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder,
        displayName: bank.displayName,
      },
    }
  }

  private createAttemptCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return `KH${Array.from(randomBytes(5), (byte) => alphabet[byte % alphabet.length]).join('')}`
  }

  private transferContent(
    enrollment: Pick<CourseEnrollment, 'enrollmentId'>,
    attemptCode: string,
    studentName?: string | null,
    parentPhone?: string | null,
  ): string {
    const normalizedName = studentName
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const phone = parentPhone?.replace(/\D/g, '')
    return [attemptCode, `CE${enrollment.enrollmentId}`, normalizedName ? `HS${normalizedName}` : null, phone]
      .filter(Boolean)
      .join(' ')
  }

  private createVietQrUrl(bank: ReceivingBankAccount, amount: number, description: string): string {
    return this.sepayService.createVietQrUrl({
      bankCode: bank.bankCode,
      accountNumber: bank.accountNumber,
      amount,
      description,
    })
  }
}
