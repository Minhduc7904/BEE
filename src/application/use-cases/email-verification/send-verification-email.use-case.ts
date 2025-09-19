// src/application/use-cases/email-verification/send-verification-email.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { IEmailVerificationTokenRepository } from '../../../domain/repositories/email-verification-token.repository'
import type { IEmailService } from '../../../infrastructure/interfaces/email.interface'
import { EmailVerificationTokenService } from '../../../infrastructure/services/email-verification-token.service'
import {
  NotFoundException,
  ConflictException,
  BusinessLogicException,
} from '../../../shared/exceptions/custom-exceptions'

export interface SendVerificationEmailCommand {
  userId: number
  baseUrl: string // URL base để tạo verification link
}

export interface SendVerificationEmailResult {
  emailSent: string
  expiresAt: Date
}

@Injectable()
export class SendVerificationEmailUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IEmailVerificationTokenRepository')
    private readonly emailVerificationRepository: IEmailVerificationTokenRepository,
    @Inject('IEmailService')
    private readonly emailService: IEmailService,
    private readonly tokenService: EmailVerificationTokenService,
  ) {}

  async execute(command: SendVerificationEmailCommand): Promise<SendVerificationEmailResult> {
    // 1. Tìm user
    const user = await this.userRepository.findById(command.userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${command.userId} not found`)
    }

    // 2. Kiểm tra email
    if (!user.email) {
      throw new BusinessLogicException('User does not have an email address')
    }

    // 3. Kiểm tra email đã verified chưa
    if (user.isEmailVerified) {
      throw new ConflictException('Email is already verified')
    }

    // 4. Kiểm tra xem đã có email nào trong database verify chưa
    const existingVerifiedUser = await this.userRepository.findByEmail(user.email!)
    if (existingVerifiedUser) {
      throw new ConflictException('Email is already verified by another user')
    }

    // 5. Generate token
    const { rawToken, tokenHash } = this.tokenService.generateToken()
    const expiresAt = this.tokenService.generateExpiryTime()

    // 6. Lưu token vào database
    await this.emailVerificationRepository.create({
      userId: command.userId,
      tokenHash,
      expiresAt,
    })

    // 7. Tạo verification URL
    const verificationUrl = `${command.baseUrl}/api/auth/verify-email?token=${rawToken}`

    // 8. Gửi email
    await this.emailService.sendVerificationEmail({
      email: user.email!,
      firstName: user.firstName,
      verificationUrl,
      appName: 'BeeMath',
    })

    return {
      emailSent: user.email,
      expiresAt,
    }
  }
}
