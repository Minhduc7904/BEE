// src/presentation/controllers/google-auth-student.controller.ts
import { Controller, Get, UseGuards, Req, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GoogleOAuthStudentGuard } from '../../shared/guards/google-oauth-student.guard';
import { GoogleOAuthStudentUseCase } from '../../application/use-cases/auth/student/google-oauth-student.use-case';
import { GoogleUserProfileDto, GoogleAuthResponseDto } from '../../application/dtos/auth/google-auth.dto';
import { ErrorResponseDto } from '../../application/dtos/error-response.dto';
import { ExceptionHandler } from '../../shared/utils/exception-handler.util';

@ApiTags('Google Authentication - Student')
@Controller('auth/google/student')
export class GoogleAuthStudentController {
    constructor(
        private readonly googleOAuthStudentUseCase: GoogleOAuthStudentUseCase,
    ) {}

    @Get()
    @UseGuards(GoogleOAuthStudentGuard)
    @ApiOperation({ 
        summary: 'Khởi tạo Google OAuth flow cho Student',
        description: 'Redirect student đến Google để đăng nhập'
    })
    @ApiResponse({
        status: HttpStatus.FOUND,
        description: 'Redirect đến Google OAuth'
    })
    async googleAuthStudent() {
        // Guard sẽ handle redirect
    }

    @Get('callback')
    @HttpCode(HttpStatus.OK)
    @UseGuards(GoogleOAuthStudentGuard)
    @ApiOperation({ 
        summary: 'Google OAuth callback cho Student',
        description: 'Xử lý callback từ Google sau khi student đăng nhập. Chỉ cho phép tài khoản student hoặc tạo student mới.'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Đăng nhập Google Student thành công',
        type: GoogleAuthResponseDto,
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
                userType: 'student'
            }
        }
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
            path: '/auth/google/student/callback'
        }
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
            path: '/auth/google/student/callback'
        }
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
            path: '/auth/google/student/callback'
        }
    })
    async googleAuthStudentRedirect(
        @Req() req: Request,
        @Res() res: Response
    ) {
        return ExceptionHandler.execute(async () => {
            const googleProfile = req.user as GoogleUserProfileDto;
            
            if (!googleProfile) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Lỗi xác thực Google',
                    statusCode: HttpStatus.BAD_REQUEST,
                    timestamp: new Date().toISOString(),
                    path: '/auth/google/student/callback'
                });
            }

            const result = await this.googleOAuthStudentUseCase.execute(googleProfile);

            // Option 1: Return JSON (for API)
            return res.status(HttpStatus.OK).json(result);
            
            // Option 2: Redirect to student frontend with token (uncomment nếu cần)
            // const frontendUrl = process.env.STUDENT_FRONTEND_URL || 'http://localhost:3000/student';
            // const redirectUrl = `${frontendUrl}/auth/success?token=${result.accessToken}&refresh=${result.refreshToken}`;
            // return res.redirect(redirectUrl);
        });
    }
}
