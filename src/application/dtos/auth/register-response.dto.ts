// src/auth/dto/register-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty({ description: 'ID người dùng', example: 1 })
    userId: number;

    @ApiProperty({ description: 'Tên đăng nhập', example: 'admin123' })
    username: string;

    @ApiPropertyOptional({ description: 'Email', example: 'admin@example.com' })
    email?: string;

    @ApiProperty({ description: 'Họ', example: 'Nguyễn' })
    firstName: string;

    @ApiProperty({ description: 'Tên', example: 'Văn A' })
    lastName: string;

    @ApiProperty({ description: 'Kích hoạt', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Thời điểm tạo', example: '2025-08-27T10:30:00.000Z' })
    createdAt: Date;
}

export class AdminResponseDto extends UserResponseDto {
    @ApiProperty({ description: 'ID admin', example: 1 })
    adminId: number;

    @ApiPropertyOptional({ description: 'Môn phụ trách', example: 'Toán học' })
    subject?: string;
}

export class StudentResponseDto extends UserResponseDto {
    @ApiProperty({ description: 'ID học sinh', example: 1 })
    studentId: number;

    @ApiProperty({ description: 'Khối lớp', example: 11 })
    grade: number;

    @ApiPropertyOptional({ description: 'Trường THPT', example: 'THPT Chu Văn An' })
    school?: string;

    @ApiPropertyOptional({ description: 'SĐT học sinh', example: '0987654321' })
    studentPhone?: string;

    @ApiPropertyOptional({ description: 'SĐT phụ huynh', example: '0912345678' })
    parentPhone?: string;
}

/**
 * Lớp bao response dạng generic. Lưu ý: Swagger không tự suy luận generic,
 * nên các lớp con cụ thể phải ghi đè `data` bằng decorator `@ApiProperty({ type: ... })`.
 */
export class RegisterResponseDto<TData> {
    @ApiProperty({ description: 'Trạng thái thành công', example: true })
    success: boolean;

    @ApiProperty({ description: 'Thông báo kết quả', example: 'Đăng ký thành công' })
    message: string;

    // Với generic, lớp con sẽ declare lại field này để Swagger hiểu đúng kiểu.
    data: TData;
}

export class RegisterAdminResponseDto extends RegisterResponseDto<AdminResponseDto> {
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

export class RegisterStudentResponseDto extends RegisterResponseDto<StudentResponseDto> {
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
