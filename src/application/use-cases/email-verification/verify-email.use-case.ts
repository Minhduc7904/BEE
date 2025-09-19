// src/application/use-cases/email-verification/verify-email.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { IEmailVerificationTokenRepository } from '../../../domain/repositories/email-verification-token.repository'
import { EmailVerificationTokenService } from '../../../infrastructure/services/email-verification-token.service'
import {
  NotFoundException,
  BusinessLogicException,
  ConflictException,
} from '../../../shared/exceptions/custom-exceptions'

export interface VerifyEmailCommand {
  token: string
}

export interface VerifyEmailResult {
  emailVerified: string
  verifiedAt: Date
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IEmailVerificationTokenRepository')
    private readonly emailVerificationRepository: IEmailVerificationTokenRepository,
    private readonly tokenService: EmailVerificationTokenService,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResult> {
    // 1. Hash token để tìm trong database
    const tokenHash = this.tokenService.hashToken(command.token)
    // 2. Tìm token trong database
    const verificationToken = await this.emailVerificationRepository.findByTokenHash(tokenHash)
    if (!verificationToken) {
      throw new NotFoundException('Invalid verification token')
    }

    // 3. Kiểm tra token còn valid không
    if (!verificationToken.canBeUsed()) {
      if (verificationToken.isExpired()) {
        throw new BusinessLogicException('Verification token has expired')
      }
      if (verificationToken.isConsumed()) {
        throw new BusinessLogicException('Verification token has already been used')
      }
    }

    // 4. Tìm user
    const user = await this.userRepository.findById(verificationToken.userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${verificationToken.userId} not found`)
    }

    // 5. Kiểm tra email đã verified chưa
    if (user.isEmailVerified) {
      throw new ConflictException('Email is already verified')
    }

    // 6. Kiểm tra xem đã có email nào trong database verify chưa
    const existingVerifiedUser = await this.userRepository.findByEmail(user.email!)
    if (existingVerifiedUser) {
      throw new ConflictException('Email is already verified by another user')
    }

    // 7. Verify time
    const verifiedAt = new Date()

    // 8. Update user email verification status
    await this.userRepository.update(user.userId, {
      isEmailVerified: true,
      emailVerifiedAt: verifiedAt,
    })

    // 9. Mark token as consumed
    await this.emailVerificationRepository.markAsConsumed(verificationToken.id)

    return {
      emailVerified: user.email!,
      verifiedAt,
    }
  }
}
