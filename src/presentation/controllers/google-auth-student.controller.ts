// src/presentation/controllers/google-auth-student.controller.ts
import { Controller, Get, UseGuards, Req, Res, HttpStatus, HttpCode } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { GoogleOAuthStudentGuard } from '../../shared/guards/google-oauth-student.guard'
import { GoogleOAuthStudentUseCase } from '../../application/use-cases/auth/student/google-oauth-student.use-case'
import { GoogleUserProfileDto } from '../../application/dtos/auth/google-auth.dto'
import { LoginResponseDto } from '../../application/dtos/auth/login-response.dto'
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@ApiTags('Google Authentication - Student')
@Controller('auth/google/student')
export class GoogleAuthStudentController {
  constructor(private readonly googleOAuthStudentUseCase: GoogleOAuthStudentUseCase) {}

  @Get()
  @UseGuards(GoogleOAuthStudentGuard)
  @ApiOperation({
    summary: 'Khởi tạo Google OAuth flow cho Student',
    description: 'Redirect student đến Google để đăng nhập',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirect đến Google OAuth',
  })
  async googleAuthStudent() {
    // Guard sẽ handle redirect
  }

  @Get('callback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(GoogleOAuthStudentGuard)
  @ApiOperation({
    summary: 'Google OAuth callback cho Student',
    description:
      'Xử lý callback từ Google sau khi student đăng nhập. Chỉ cho phép tài khoản student hoặc tạo student mới.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập Google Student thành công',
    type: LoginResponseDto,
    example: {
      message: 'Đăng nhập Google Student thành công',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'refresh_token_here...',
      user: {
        userId: 2,
        email: 'student@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        username: 'student_johndoe_123456',
        userType: 'student',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lỗi xác thực Google',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Lỗi xác thực Google',
      statusCode: 400,
      timestamp: '2025-09-08T13:30:00.000Z',
      path: '/auth/google/student/callback',
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Tài khoản không phải student',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Tài khoản này không phải tài khoản sinh viên. Vui lòng sử dụng đăng nhập cho admin.',
      statusCode: 401,
      timestamp: '2025-09-08T13:30:00.000Z',
      path: '/auth/google/student/callback',
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username đã tồn tại',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Username đã tồn tại',
      statusCode: 409,
      timestamp: '2025-09-08T13:30:00.000Z',
      path: '/auth/google/student/callback',
    },
  })
  async googleAuthStudentRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

    try {
      const googleProfile = req.user as GoogleUserProfileDto

      if (!googleProfile) {
        console.error('Google OAuth: No user profile found')
        const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent('Lỗi xác thực Google')}`
        return res.redirect(redirectUrl)
      }

      const result = await this.googleOAuthStudentUseCase.execute(googleProfile)

      if (!result.data) {
        console.error('Google OAuth: No result data from use case')
        const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent('Lỗi xử lý đăng nhập Google')}`
        return res.redirect(redirectUrl)
      }

      // Redirect to frontend auth callback with authentication tokens only
      // Frontend sẽ gọi API profile để lấy user data sau khi có tokens
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.data.tokens.accessToken}&refresh=${result.data.tokens.refreshToken}`
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

      const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`
      return res.redirect(redirectUrl)
    }
  }
}
