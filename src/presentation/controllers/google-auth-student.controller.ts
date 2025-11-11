// src/presentation/controllers/google-auth-student.controller.ts
import { Controller, Get, UseGuards, Req, Res, HttpStatus, HttpCode } from '@nestjs/common'
import type { Request, Response } from 'express'
import { GoogleOAuthStudentGuard } from '../../shared/guards/google-oauth-student.guard'
import { GoogleOAuthStudentUseCase } from '../../application/use-cases/auth/student/google-oauth-student.use-case'
import { GoogleUserProfileDto } from '../../application/dtos/auth/google-auth.dto'
import { LoginResponseDto, ErrorResponseDto } from '../../application/dtos'

@Controller('auth/google/student')
export class GoogleAuthStudentController {
  constructor(private readonly googleOAuthStudentUseCase: GoogleOAuthStudentUseCase) { }

  @Get()
  @UseGuards(GoogleOAuthStudentGuard)
      async googleAuthStudent() {
    // Guard sẽ handle redirect
  }

  @Get('callback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(GoogleOAuthStudentGuard)
            async googleAuthStudentRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

    try {
      const googleProfile = req.user as GoogleUserProfileDto

      if (!googleProfile) {
        console.error('Google OAuth: No user profile found')
        const redirectUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Lỗi xác thực Google')}`
        return res.redirect(redirectUrl)
      }

      const result = await this.googleOAuthStudentUseCase.execute(googleProfile)

      if (!result.data) {
        console.error('Google OAuth: No result data from use case')
        const redirectUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Lỗi xử lý đăng nhập Google')}`
        return res.redirect(redirectUrl)
      }

      // Redirect to frontend auth callback with authentication tokens only
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.data.tokens.accessToken}&refresh=${result.data.tokens.refreshToken}`
      return res.redirect(redirectUrl)
    } catch (error) {
      console.error('Google OAuth callback error:', error)

      // Xử lý các loại lỗi cụ thể
      let errorMessage = 'Lỗi đăng nhập Google'

      if (error instanceof Error) {
        // Kiểm tra một số lỗi phổ biến
        if (error.message.includes('Username đã tồn tại')) {
          errorMessage = 'Username đã tồn tại'
        } else if (error.message.includes('không phải tài khoản sinh viên')) {
          errorMessage = 'Tài khoản này không phải tài khoản sinh viên'
        } else if (error.message.includes('Email đã được sử dụng')) {
          errorMessage = 'Email đã được sử dụng bởi tài khoản khác'
        } else {
          errorMessage = error.message
        }
      }

      const redirectUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`
      return res.redirect(redirectUrl)
    }
  }
}
