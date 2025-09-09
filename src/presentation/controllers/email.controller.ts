// src/presentation/controllers/email.controller.ts
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import type { IEmailService } from '../../infrastructure/interfaces/email.interface';
import { BaseResponseDto } from '../../application/dtos/base-response.dto';

class SendTestEmailDto {
    @ApiProperty({ 
        description: 'Email address to send test email',
        example: 'user@example.com' 
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email là bắt buộc' })
    email: string;
}

@ApiTags('Email')
@ApiBearerAuth('JWT-auth')
@Controller('email')
export class EmailController {
    constructor(
        @Inject('IEmailService')
        private readonly emailService: IEmailService,
    ) { }

    @Post('test')
    @ApiOperation({
        summary: 'Gửi email test',
        description: 'Gửi email test để kiểm tra email service hoạt động'
    })
    @ApiResponse({
        status: 200,
        description: 'Email test đã được gửi thành công',
        type: BaseResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Lỗi validation hoặc email không hợp lệ',
    })
    async sendTestEmail(@Body() dto: SendTestEmailDto): Promise<BaseResponseDto> {
        try {
            console.log('Sending test email to', dto.email);
            await this.emailService.sendTestEmail(dto.email);

            return {
                success: true,
                message: `Email test đã được gửi thành công đến ${dto.email}`,
                data: null,
            };
        } catch (error) {
            throw error;
        }
    }

    @Post('verification')
    @ApiOperation({
        summary: 'Gửi email xác nhận',
        description: 'Gửi email xác nhận đăng ký cho user'
    })
    async sendVerificationEmail(@Body() dto: any): Promise<BaseResponseDto> {
        try {
            await this.emailService.sendVerificationEmail({
                email: dto.email,
                firstName: dto.firstName,
                verificationUrl: dto.verificationUrl,
                appName: 'BeeMath',
            });

            return {
                success: true,
                message: `Email xác nhận đã được gửi đến ${dto.email}`,
                data: null,
            };
        } catch (error) {
            throw error;
        }
    }

    @Post('welcome')
    @ApiOperation({
        summary: 'Gửi email chào mừng',
        description: 'Gửi email chào mừng cho user mới'
    })
    async sendWelcomeEmail(@Body() dto: any): Promise<BaseResponseDto> {
        try {
            await this.emailService.sendWelcomeEmail({
                email: dto.email,
                firstName: dto.firstName,
                role: dto.role,
                appName: 'BeeMath',
                loginUrl: 'http://localhost:3001',
            });

            return {
                success: true,
                message: `Email chào mừng đã được gửi đến ${dto.email}`,
                data: null,
            };
        } catch (error) {
            throw error;
        }
    }

    @Post('password-reset')
    @ApiOperation({
        summary: 'Gửi email đặt lại mật khẩu',
        description: 'Gửi email với link đặt lại mật khẩu'
    })
    async sendPasswordResetEmail(@Body() dto: any): Promise<BaseResponseDto> {
        try {
            await this.emailService.sendPasswordResetEmail({
                email: dto.email,
                firstName: dto.firstName,
                resetUrl: dto.resetUrl,
                appName: 'BeeMath',
            });

            return {
                success: true,
                message: `Email đặt lại mật khẩu đã được gửi đến ${dto.email}`,
                data: null,
            };
        } catch (error) {
            throw error;
        }
    }
}
