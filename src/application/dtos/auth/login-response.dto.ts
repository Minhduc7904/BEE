import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../base-response.dto';

export class TokensDto {
    @ApiProperty({
        description: 'JWT Access Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'Refresh Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Thời gian hết hạn Access Token (giây)',
        example: 3600
    })
    expiresIn: number;
}

export class UserInfoDto {
    @ApiProperty({ description: 'ID người dùng', example: 1 })
    userId: number;

    @ApiProperty({ description: 'Tên đăng nhập', example: 'admin123' })
    username: string;

    @ApiProperty({ description: 'Email', example: 'admin@example.com', required: false })
    email?: string;

    @ApiProperty({ description: 'Họ', example: 'Nguyễn' })
    firstName: string;

    @ApiProperty({ description: 'Tên', example: 'Văn A' })
    lastName: string;

    @ApiProperty({ description: 'Vai trò', example: 'admin' })
    role: 'admin' | 'student';

    @ApiProperty({ description: 'Thông tin chi tiết vai trò' })
    roleDetails?: {
        adminId?: number;
        subject?: string;
        studentId?: number;
        grade?: number;
        school?: string;
    };
}

export class LoginDataDto {
    @ApiProperty({ type: TokensDto })
    tokens: TokensDto;

    @ApiProperty({ type: UserInfoDto })
    user: UserInfoDto;
}

export class LoginResponseDto extends BaseResponseDto<LoginDataDto> {
    @ApiProperty({ type: LoginDataDto })
    declare data: LoginDataDto;
}
