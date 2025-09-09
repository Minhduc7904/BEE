// src/auth/dto/register-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminResponseDto } from '../admin/admin.dto';
import { StudentResponseDto } from '../student/student.dto';
import { BaseResponseDto } from '../base-response.dto';

export class RegisterAdminResponseDto extends BaseResponseDto<AdminResponseDto> {
    @ApiProperty({
        description: 'Dữ liệu admin đã tạo',
        type: () => AdminResponseDto,
        example: {
            userId: 1,
            username: 'admin123',
            email: null, // có thể null
            firstName: 'Nguyễn',
            lastName: 'Văn A',
            isActive: true,
            createdAt: '2025-08-27T10:30:00.000Z',
            adminId: 1,
            subject: null, // có thể null
        },
    })
    declare data: AdminResponseDto;
}

export class RegisterStudentResponseDto extends BaseResponseDto<StudentResponseDto> {
    @ApiProperty({
        description: 'Dữ liệu học sinh đã tạo',
        type: () => StudentResponseDto,
        example: {
            userId: 2,
            username: 'student123',
            email: null, // có thể null
            firstName: 'Trần',
            lastName: 'Thị B',
            isActive: true,
            createdAt: '2025-08-27T10:30:00.000Z',
            studentId: 1,
            grade: 11,
            school: null, // có thể null
            studentPhone: null, // có thể null
            parentPhone: null, // có thể null
        },
    })
    declare data: StudentResponseDto;
}
