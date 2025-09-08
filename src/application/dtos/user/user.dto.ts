// src/application/dtos/user/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty({ description: 'ID của user', example: 1 })
    userId: number;

    @ApiProperty({ description: 'Tên đăng nhập', example: 'john_doe' })
    username: string;

    @ApiProperty({ description: 'Email', example: 'john@example.com' })
    email: string;

    @ApiProperty({ description: 'Họ', example: 'Nguyen' })
    firstName: string;

    @ApiProperty({ description: 'Tên', example: 'Van A' })
    lastName: string;

    @ApiProperty({ description: 'Họ và tên đầy đủ', example: 'Nguyen Van A' })
    fullName: string;

    @ApiProperty({ description: 'Số điện thoại', example: '0123456789', required: false })
    phoneNumber?: string;

    @ApiProperty({ description: 'Trạng thái hoạt động', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Ngày tạo', example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Ngày cập nhật', example: '2024-01-02T00:00:00.000Z' })
    updatedAt: Date;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
    }

    /**
     * Factory method tạo từ User entity
     */
    static fromUser(user: any): UserResponseDto {
        return new UserResponseDto({
            userId: user.userId,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
}
