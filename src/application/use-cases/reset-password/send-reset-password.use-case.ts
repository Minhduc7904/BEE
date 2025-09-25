// src/application/use-cases/email-verification/send-verification-email.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IResetPasswordTokenRepository, IUserRepository } from '../../../domain/repositories'
import type { IEmailService } from '../../../infrastructure/interfaces/email.interface'
import { TokenService } from '../../../infrastructure/services'
import {
    NotFoundException,
    ConflictException,
    BusinessLogicException,
} from '../../../shared/exceptions/custom-exceptions'

import {
    SendResetPasswordEmailDto,
    SendResetPasswordEmailResult,
    BaseResponseDto
} from '../../dtos'

@Injectable()
export class SendResetPasswordEmailUseCase {
    constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordResetTokenRepository')
    private readonly resetPasswordTokenRepository: IResetPasswordTokenRepository,
    @Inject('IEmailService')
    private readonly emailService: IEmailService,
    private readonly tokenService: TokenService,
    ) { }

    async execute(redirectUrl, dto: SendResetPasswordEmailDto): Promise<BaseResponseDto<SendResetPasswordEmailResult>> {
        const user = await this.userRepository.findByEmail(dto.email)
        if (!user) {
            throw new NotFoundException('Không tìm thấy Email đã đăng ký và được xác thực')
        }
        if (!user.email) {
            throw new BusinessLogicException('User does not have an email address')
        }

        const { rawToken, tokenHash } = this.tokenService.generateToken()
        const expiresAt = this.tokenService.generateExpiryTime()
        // console.log(rawToken, tokenHash)
        const token = await this.resetPasswordTokenRepository.create({
            userId: user.userId,
            tokenHash,
            expiresAt
        })
        const resetUrl = `${redirectUrl}?token=${rawToken}`

        await this.emailService.sendPasswordResetEmail({
            email: user.email!,
            firstName: user.firstName,
            resetUrl,
            appName: 'BeeMath',
        })

        return BaseResponseDto.success(
            'Gửi Email thành công',
            {
                emailSent: user.email,
                expiresAt,
            }
        )
    }
}