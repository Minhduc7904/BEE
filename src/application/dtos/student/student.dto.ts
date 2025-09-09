// src/application/dtos/student/student-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto, UpdateUserDto } from '../user/user.dto';
import { PaginationResponseDto } from '../pagination/pagination-response.dto';
import { IsOptional, IsString, IsInt, Min, Max, Matches } from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class StudentResponseDto extends UserResponseDto {
    @ApiProperty({ description: 'ID của student', example: 1 })
    studentId: number;

    @ApiPropertyOptional({ description: 'Số điện thoại sinh viên', example: '0123456789' })
    studentPhone?: string;

    @ApiPropertyOptional({ description: 'Số điện thoại phụ huynh', example: '0987654321' })
    parentPhone?: string;

    @ApiProperty({ description: 'Khối lớp', example: 12 })
    grade: number;

    @ApiPropertyOptional({ description: 'Trường học', example: 'THPT Chu Văn An' })
    school?: string;

    constructor(partial: Partial<StudentResponseDto>) {
        super(partial);
        Object.assign(this, partial);
    }

    /**
     * Factory method tạo từ User entity với Student details
     */
    static fromUserWithStudent(user: any, student: any): StudentResponseDto {
        const baseUser = UserResponseDto.fromUser(user);

        return new StudentResponseDto({
            ...baseUser,
            studentId: student.studentId,
            studentPhone: student.studentPhone,
            parentPhone: student.parentPhone,
            grade: student.grade,
            school: student.school
        });
    }

    /**
     * Factory method tạo từ Student entity có include user
     */
    static fromStudentEntity(studentWithUser: any): StudentResponseDto {
        if (!studentWithUser.user) {
            throw new Error('Student entity must include user details');
        }

        return StudentResponseDto.fromUserWithStudent(studentWithUser.user, studentWithUser);
    }

    /**
     * Hiển thị thông tin trường học
     */
    get schoolDisplay(): string {
        return this.school || 'Chưa xác định';
    }

    /**
     * Hiển thị thông tin lớp
     */
    get gradeDisplay(): string {
        return `Lớp ${this.grade}`;
    }
}

export class StudentListResponseDto extends PaginationResponseDto<StudentResponseDto> {
    declare data: StudentResponseDto[];
}

export class UpdateStudentDto extends UpdateUserDto {
    @ApiPropertyOptional({ 
        description: 'Số điện thoại sinh viên mới',
        example: '0123456789',
        pattern: '^[0-9]{10,11}$'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Số điện thoại sinh viên phải là chuỗi ký tự' })
    @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại sinh viên phải có 10-11 chữ số' })
    studentPhone?: string;

    @ApiPropertyOptional({ 
        description: 'Số điện thoại phụ huynh mới',
        example: '0987654321',
        pattern: '^[0-9]{10,11}$'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Số điện thoại phụ huynh phải là chuỗi ký tự' })
    @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại phụ huynh phải có 10-11 chữ số' })
    parentPhone?: string;

    @ApiPropertyOptional({ 
        description: 'Khối lớp mới',
        example: 12,
        minimum: 1,
        maximum: 12
    })
    @IsOptional()
    @IsInt({ message: 'Khối lớp phải là số nguyên' })
    @Min(1, { message: 'Khối lớp phải từ 1 đến 12' })
    @Max(12, { message: 'Khối lớp phải từ 1 đến 12' })
    grade?: number;

    @ApiPropertyOptional({ 
        description: 'Trường học mới',
        example: 'THPT Lý Thái Tổ',
        maxLength: 120
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Trường học phải là chuỗi ký tự' })
    school?: string;
}
