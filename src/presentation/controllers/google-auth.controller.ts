// src/presentation/controllers/google-auth.controller.ts
import { Controller, Get, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GoogleOAuthGuard } from '../../shared/guards/google-oauth.guard';
import { GoogleOAuthUseCase } from '../../application/use-cases/auth/google-oauth.use-case';
import { GoogleUserProfileDto, GoogleAuthResponseDto } from '../../application/dtos/auth/google-auth.dto';
import { ErrorResponseDto } from '../../application/dtos/error-response.dto';

@ApiTags('Google Authentication')
@Controller('auth/google')
export class GoogleAuthController {
    constructor(
        private readonly googleOAuthUseCase: GoogleOAuthUseCase,
    ) {}

    @Get()
    @UseGuards(GoogleOAuthGuard)
    @ApiOperation({ 
        summary: 'Khởi tạo Google OAuth flow',
        description: 'Redirect user đến Google để đăng nhập'
    })
    @ApiResponse({
        status: 302,
        description: 'Redirect đến Google OAuth'
    })
    async googleAuth() {
        // Guard sẽ handle redirect
    }

    @Get('callback')
    @UseGuards(GoogleOAuthGuard)
    @ApiOperation({ 
        summary: 'Google OAuth callback',
        description: 'Xử lý callback từ Google sau khi user đăng nhập'
    })
    @ApiResponse({
        status: 200,
        description: 'Đăng nhập Google thành công',
        type: GoogleAuthResponseDto,
        example: {
            message: 'Đăng nhập Google thành công',
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'refresh_token_here...',
            user: {
                userId: 1,
                email: 'user@gmail.com',
                firstName: 'John',
                lastName: 'Doe',
                username: 'john_123456',
                userType: 'student'
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
            timestamp: '2025-09-05T13:30:00.000Z',
            path: '/auth/google/callback'
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Email đã được sử dụng',
        type: ErrorResponseDto,
        example: {
            success: false,
            message: 'Email đã được sử dụng',
            statusCode: 409,
            timestamp: '2025-09-05T13:30:00.000Z',
            path: '/auth/google/callback'
        }
    })
    async googleAuthRedirect(
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
                    path: '/auth/google/callback'
                });
            }

            const result = await this.googleOAuthUseCase.execute(googleProfile);

            // Có thể redirect về frontend với token
            // hoặc trả về JSON response tùy theo requirement
            
            // Option 1: Return JSON (for API)
            return res.status(HttpStatus.OK).json(result);
            
            // Option 2: Redirect to frontend with token (uncomment nếu cần)
            // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            // const redirectUrl = `${frontendUrl}/auth/success?token=${result.accessToken}&refresh=${result.refreshToken}`;
            // return res.redirect(redirectUrl);
            
        } catch (error) {
            console.error('Google OAuth error:', error);
            
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Lỗi đăng nhập Google',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: new Date().toISOString(),
                path: '/auth/google/callback'
            });
        }
    }
}
