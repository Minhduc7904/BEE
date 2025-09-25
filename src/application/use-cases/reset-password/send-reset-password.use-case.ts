// src/application/use-cases/email-verification/send-verification-email.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IResetPasswordTokenRepository, IUserRepository } from '../../../domain/repositories'
import type { IEmailService } from '../../../infrastructure/interfaces/email.interface'
import { EmailVerificationTokenService } from '../../../infrastructure/services'
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