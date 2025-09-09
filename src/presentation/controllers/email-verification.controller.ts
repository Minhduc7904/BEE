// src/presentation/controllers/email-verification.controller.ts
import { Controller, Post, Get, Param, Query, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { SendVerificationEmailUseCase } from '../../application/use-cases/email-verification/send-verification-email.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/email-verification/verify-email.use-case';
import {
    SendVerificationEmailResponseDto,
    VerifyEmailResponseDto
} from '../../application/dtos/auth/email-verification.dto';
import { ErrorResponseDto } from '../../application/dtos/error-response.dto';

@ApiTags('Email Verification')
@Controller('auth')
export class EmailVerificationController {
    constructor(
        private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
        private readonly verifyEmailUseCase: VerifyEmailUseCase,
    ) { }

    @Post('send-verification-email/:userId')
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
        status: 200,
        description: 'Email xác nhận đã được gửi thành công',
        type: SendVerificationEmailResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'User không tồn tại',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'Email đã được xác nhận',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'User không có email',
        type: ErrorResponseDto,
    })
    async sendVerificationEmail(
        @Param('userId', ParseIntPipe) userId: number,
        @Req() request: Request,
    ): Promise<SendVerificationEmailResponseDto> {
        // Tạo base URL từ request
        const protocol = request.protocol;
        const host = request.get('host');
        const baseUrl = `${protocol}://${host}`;

        const result = await this.sendVerificationEmailUseCase.execute({
            userId,
            baseUrl,
        });

        return {
            success: true,
            message: 'Email xác nhận đã được gửi thành công',
            emailSent: result.emailSent,
            expiresAt: result.expiresAt,
        };
    }

    @Get('verify-email')
    @ApiOperation({
        summary: 'Xác nhận email',
        description: 'Xác nhận email thông qua token được gửi trong email.',
    })
    @ApiQuery({
        name: 'token',
        type: String,
        description: 'Token xác nhận email',
        example: 'abc123def456ghi789',
    })
    @ApiResponse({
        status: 200,
        description: 'Email đã được xác nhận thành công',
        type: VerifyEmailResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Token không hợp lệ hoặc user không tồn tại',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Token đã hết hạn hoặc đã được sử dụng, hoặc email đã được xác nhận',
        type: ErrorResponseDto,
    })
    async verifyEmail(
        @Query('token') token: string,
    ): Promise<VerifyEmailResponseDto> {
        const result = await this.verifyEmailUseCase.execute({ token });

        return {
            success: true,
            message: 'Email đã được xác nhận thành công',
            emailVerified: result.emailVerified,
            verifiedAt: result.verifiedAt,
        };
    }
}
