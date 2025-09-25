// src/presentation/controllers/.controller.ts
import { Controller, Post, Get, Param, Query, ParseIntPipe, Req, Res, HttpCode, HttpStatus, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { SendResetPasswordEmailUseCase, ResetPasswordUseCase } from '../../application/use-cases'
import {
    SendResetPasswordEmailDto,
    SendResetPasswordEmailResult,
    BaseResponseDto,
    ResetPasswordDto
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@ApiTags('Email Reset Password')
@Controller('auth')
export class EmailResetPasswordController {
  constructor(
    private readonly sendResetPasswordEmailUseCase: SendResetPasswordEmailUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('send-reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gửi email đổi mật khẩu',
    description: 'Gửi email đổi mật khẩu',
  })
  async sendVerificationEmail(
    @Body() dto: SendResetPasswordEmailDto,
    @Req() request: Request,
  ): Promise<BaseResponseDto<SendResetPasswordEmailResult>> {
    return ExceptionHandler.execute(async () => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const redirectUrl = `${frontendUrl}/auth/reset-password`
      const result = await this.sendResetPasswordEmailUseCase.execute(redirectUrl, {
        email: dto.email,
      })

      return result
    })
  }

  @Post('reset-password/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đặt lại mật khẩu qua token',
    description: 'API này dùng để đặt lại mật khẩu thông qua token được gửi qua email',
  })
  async resetPasswordWithToken(
    @Body() dto: ResetPasswordDto,
  ): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(async () => {
      return this.resetPasswordUseCase.executeWithToken(dto)
    })
  }

  
}
