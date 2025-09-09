// src/presentation/controllers/google-auth-admin.controller.ts
import { Controller, Get, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GoogleOAuthAdminGuard } from '../../shared/guards/google-oauth-admin.guard';
import { GoogleOAuthAdminUseCase } from '../../application/use-cases/auth/admin/google-oauth-admin.use-case';
import { GoogleUserProfileDto, GoogleAuthResponseDto } from '../../application/dtos/auth/google-auth.dto';
import { ErrorResponseDto } from '../../application/dtos/error-response.dto';

@ApiTags('Google Authentication - Admin')
@Controller('auth/google/admin')
export class GoogleAuthAdminController {
    constructor(
        private readonly googleOAuthAdminUseCase: GoogleOAuthAdminUseCase,
    ) {}

    @Get()
    @UseGuards(GoogleOAuthAdminGuard)
    @ApiOperation({ 
        summary: 'Khởi tạo Google OAuth flow cho Admin',
        description: 'Redirect admin đến Google để đăng nhập'
    })
    @ApiResponse({
        status: 302,
        description: 'Redirect đến Google OAuth'
    })
    async googleAuthAdmin() {
        // Guard sẽ handle redirect
    }

    @Get('callback')
    @UseGuards(GoogleOAuthAdminGuard)
    @ApiOperation({ 
        summary: 'Google OAuth callback cho Admin',
        description: 'Xử lý callback từ Google sau khi admin đăng nhập. Chỉ cho phép tài khoản admin hoặc tạo admin mới.'
    })
    @ApiResponse({
        status: 200,
        description: 'Đăng nhập Google Admin thành công',
        type: GoogleAuthResponseDto,
        example: {
            message: 'Đăng nhập Google Admin thành công',
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'refresh_token_here...',
            user: {
                userId: 1,
                email: 'admin@gmail.com',
                firstName: 'Admin',
                lastName: 'User',
                username: 'admin_adminuser_123456',
                userType: 'admin'
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Lỗi xác thực Google',
        type: ErrorResponseDto,
        example: {
            success: false,
            message: 'Lỗi xác thực Google',
            statusCode: 400,
            timestamp: '2025-09-08T13:30:00.000Z',
            path: '/auth/google/admin/callback'
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Tài khoản không có quyền admin',
        type: ErrorResponseDto,
        example: {
            success: false,
            message: 'Tài khoản này không có quyền admin. Vui lòng sử dụng đăng nhập cho sinh viên.',
            statusCode: 401,
            timestamp: '2025-09-08T13:30:00.000Z',
            path: '/auth/google/admin/callback'
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Username đã tồn tại',
        type: ErrorResponseDto,
        example: {
            success: false,
            message: 'Username đã tồn tại',
            statusCode: 409,
            timestamp: '2025-09-08T13:30:00.000Z',
            path: '/auth/google/admin/callback'
        }
    })
    async googleAuthAdminRedirect(
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const googleProfile = req.user as GoogleUserProfileDto;
            
            if (!googleProfile) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Lỗi xác thực Google',
                    statusCode: HttpStatus.BAD_REQUEST,
                    timestamp: new Date().toISOString(),
                    path: '/auth/google/admin/callback'
                });
            }

            const result = await this.googleOAuthAdminUseCase.execute(googleProfile);

            // Option 1: Return JSON (for API)
            return res.status(HttpStatus.OK).json(result);
            
            // Option 2: Redirect to admin frontend with token (uncomment nếu cần)
            // const frontendUrl = process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000/admin';
            // const redirectUrl = `${frontendUrl}/auth/success?token=${result.accessToken}&refresh=${result.refreshToken}`;
            // return res.redirect(redirectUrl);
            
        } catch (error) {
            console.error('Google OAuth Admin error:', error);
            
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Lỗi đăng nhập Google Admin',
                statusCode,
                timestamp: new Date().toISOString(),
                path: '/auth/google/admin/callback'
            });
        }
    }
}
