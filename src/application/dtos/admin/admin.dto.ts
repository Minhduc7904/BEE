// src/application/dtos/admin/admin-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto, UpdateUserDto } from '../user/user.dto';
import { IsOptional, IsString, MaxLength, IsNumber, IsPositive } from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';

export class AdminResponseDto extends UserResponseDto {
    @ApiProperty(SWAGGER_PROPERTIES.ADMIN_ID)
    adminId: number;

    @ApiPropertyOptional()
    subjectId?: number;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.SUBJECT)
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
            subjectId: admin.subjectId,
            subject: admin.getSubjectName ? admin.getSubjectName() : admin.subject?.name,
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
        description: 'ID của môn học (null để bỏ gán môn học)',
        example: 1
    })
    @IsOptional()
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Subject ID') })
    @IsPositive({ message: 'Subject ID phải là số dương' })
    subjectId?: number;
}
