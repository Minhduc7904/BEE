// src/presentation/controllers/email-verification.controller.ts
import { Controller, Post, Get, Param, Query, ParseIntPipe, Req, Res, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { SendVerificationEmailUseCase } from '../../application/use-cases/email-verification/send-verification-email.use-case'
import { VerifyEmailUseCase } from '../../application/use-cases/email-verification/verify-email.use-case'
import {
  SendVerificationEmailResponseDto,
  VerifyEmailResponseDto,
} from '../../application/dtos/auth/email-verification.dto'
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@ApiTags('Email Verification')
@Controller('auth')
export class EmailVerificationController {
  constructor(
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  @Post('send-verification-email/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gửi email xác nhận',
    description: 'Gửi email xác nhận cho user với userId. Email sẽ chứa link để xác nhận email.',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID của user cần gửi email xác nhận',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email xác nhận đã được gửi thành công',
    type: SendVerificationEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User không tồn tại',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email đã được xác nhận',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User không có email',
    type: ErrorResponseDto,
  })
  async sendVerificationEmail(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: Request,
  ): Promise<SendVerificationEmailResponseDto> {
    return ExceptionHandler.execute(async () => {
      // Tạo base URL từ request
      const protocol = request.protocol
      const host = request.get('host')
      const baseUrl = `${protocol}://${host}`

      const result = await this.sendVerificationEmailUseCase.execute({
        userId,
        baseUrl,
      })

      return {
        success: true,
        message: 'Email xác nhận đã được gửi thành công',
        emailSent: result.emailSent,
        expiresAt: result.expiresAt,
      }
    })
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Xác nhận email',
    description: 'Xác nhận email thông qua token được gửi trong email và redirect đến frontend.',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Token xác nhận email',
    example: 'abc123def456ghi789',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirect đến frontend với kết quả xác nhận email',
  })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

    try {
      if (!token) {
        const redirectUrl = `${frontendUrl}/email-verification/result?error=${encodeURIComponent('Token không hợp lệ')}`
        return res.redirect(redirectUrl)
      }

      const result = await this.verifyEmailUseCase.execute({ token })

      if (!result.emailVerified) {
        console.error('Email verification failed: Email not verified')
        const redirectUrl = `${frontendUrl}/email-verification/result?error=${encodeURIComponent('Xác nhận email thất bại')}`
        return res.redirect(redirectUrl)
      }

      // Redirect to frontend với kết quả thành công
      const redirectUrl = `${frontendUrl}/email-verification/result?success=true&message=${encodeURIComponent('Email đã được xác nhận thành công')}`
      return res.redirect(redirectUrl)
    } catch (error) {
      console.error('Email verification error:', error)

      // Xử lý các loại lỗi cụ thể
      let errorMessage = 'Lỗi xác nhận email'

      if (error instanceof Error) {
        // Kiểm tra một số lỗi phổ biến
        if (error.message.includes('Token đã hết hạn')) {
          errorMessage = 'Token đã hết hạn'
        } else if (error.message.includes('Token không hợp lệ')) {
          errorMessage = 'Token không hợp lệ'
        } else if (error.message.includes('Email đã được xác nhận')) {
          errorMessage = 'Email đã được xác nhận trước đó'
        } else if (error.message.includes('User không tồn tại')) {
          errorMessage = 'Người dùng không tồn tại'
        } else {
          errorMessage = error.message
        }
      }

      const redirectUrl = `${frontendUrl}/email-verification/result?error=${encodeURIComponent(errorMessage)}`
      return res.redirect(redirectUrl)
    }
  }
}
