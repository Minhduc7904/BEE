// src/application/use-cases/password/reset-password.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { IResetPasswordTokenRepository } from '../../../domain/repositories'
import { TokenService, PasswordService } from '../../../infrastructure/services'
import {
  NotFoundException,
  BusinessLogicException,
  ConflictException,
} from '../../../shared/exceptions/custom-exceptions'

import {
  ResetPasswordDto,
  BaseResponseDto
} from '../../dtos'

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordResetTokenRepository')
    private readonly resetPasswordTokenRepository: IResetPasswordTokenRepository,
    private readonly tokenService: TokenService,
    @Inject('PASSWORD_SERVICE')
    private readonly passwordService: PasswordService
  ) {}

  /**
   * Reset password bằng token từ email
   */
  async executeWithToken(dto: ResetPasswordDto): Promise<BaseResponseDto<boolean>> {
    if (!dto.token) {
      throw new ConflictException('Token không hợp lệ')
    }

    const tokenHash = this.tokenService.hashToken(dto.token)
    // console.log(tokenHash)
    const resetPasswordToken = await this.resetPasswordTokenRepository.findByTokenHash(tokenHash)
    if (!resetPasswordToken) {
      throw new NotFoundException('Token không tồn tại hoặc đã dùng')
    }
    if (!resetPasswordToken.canBeUsed()) {
      throw new BusinessLogicException('Token đã hết hạn')
    }

    const user = await this.userRepository.findById(resetPasswordToken.userId)
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng')
    }
    if (!user.isEmailVerified) {
      throw new ConflictException('Email chưa xác thực')
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword)
    await this.userRepository.update(user.userId, { passwordHash })

    // Đánh dấu token đã sử dụng
    await this.resetPasswordTokenRepository.markAsUsed(resetPasswordToken.id)

    return BaseResponseDto.success('Đặt lại mật khẩu thành công', true)
  }

  /**
   * Reset password bằng oldPassword (chỉ cho user chưa đăng ký email)
   */
  async executeWithOldPassword(dto: ResetPasswordDto, userId: number): Promise<BaseResponseDto<boolean>> {
    if (!dto.oldPassword) {
      throw new ConflictException('Thiếu mật khẩu cũ')
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng')
    }

    // Nếu user có email và đã verify → bắt buộc dùng token
    if (user.email && user.isEmailVerified) {
      throw new ConflictException('Vui lòng đặt lại mật khẩu qua email')
    }

    const isMatch = await this.passwordService.comparePassword(dto.oldPassword, user.passwordHash)
    if (!isMatch) {
      throw new ConflictException('Mật khẩu cũ không đúng')
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword)
    await this.userRepository.update(user.userId, { passwordHash: newPasswordHash })

    return BaseResponseDto.success('Đổi mật khẩu thành công', true)
  }
}
