// src/application/dtos/admin/admin-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../user/user.dto';

export class AdminResponseDto extends UserResponseDto {
    @ApiProperty({ description: 'ID của admin', example: 1 })
    adminId: number;

    @ApiProperty({ description: 'Môn học', example: 'Mathematics' })
    subject: string;

    @ApiProperty({ description: 'Mô tả về admin', example: 'Giáo viên toán học', required: false })
    description?: string;

    @ApiProperty({ description: 'Số năm kinh nghiệm', example: 5, required: false })
    experienceYears?: number;

    @ApiProperty({ description: 'Chuyên môn', example: 'Algebra, Geometry', required: false })
    specialization?: string;

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
            description: admin.description,
            experienceYears: admin.experienceYears,
            specialization: admin.specialization
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
