// src/application/dtos/admin/admin-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto, UpdateUserDto } from '../user/user.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminResponseDto extends UserResponseDto {
    @ApiProperty({ description: 'ID của admin', example: 1 })
    adminId: number;

    @ApiPropertyOptional({ description: 'Môn học', example: 'Mathematics', required: false })
    subject?: string;

    constructor(partial: Partial<AdminResponseDto>) {
        super(partial);
        Object.assign(this, partial);
    }

    /**
     * Factory method tạo từ User entity với Admin details
     */
    static fromUserWithAdmin(user: any, admin: any): AdminResponseDto {
        const baseUser = UserResponseDto.fromUser(user);
        
        return new AdminResponseDto({
            ...baseUser,
            adminId: admin.adminId,
            subject: admin.subject,
        });
    }

    /**
     * Factory method tạo từ User entity có include admin
     */
    static fromUserEntity(userWithAdmin: any): AdminResponseDto {
        if (!userWithAdmin.admin) {
            throw new Error('User entity must include admin details');
        }

        return AdminResponseDto.fromUserWithAdmin(userWithAdmin, userWithAdmin.admin);
    }
}

export class UpdateAdminDto extends UpdateUserDto {
    @ApiPropertyOptional({ 
        description: 'Môn học mới',
        example: 'Physics',
        maxLength: 120
    })
    @IsOptional()
    @IsString({ message: 'Môn học phải là chuỗi ký tự' })
    @MaxLength(120, { message: 'Môn học không được vượt quá 120 ký tự' })
    subject?: string;
}
