// src/auth/dto/register-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminResponseDto } from '../admin/admin.dto';
import { StudentResponseDto } from '../student/student.dto';
import { BaseResponseDto } from '../common/base-response.dto';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';

export class RegisterAdminResponseDto extends BaseResponseDto<AdminResponseDto> {
    @ApiProperty({
        description: 'Dữ liệu admin đã tạo',
        type: () => AdminResponseDto,
        example: {
            userId: 1,
            username: SWAGGER_PROPERTIES.USERNAME.example,
            email: null, // có thể null
            firstName: SWAGGER_PROPERTIES.FIRST_NAME.example,
            lastName: SWAGGER_PROPERTIES.LAST_NAME.example,
            isActive: true,
            createdAt: SWAGGER_PROPERTIES.CREATED_AT.example,
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
            isActive: SWAGGER_PROPERTIES.IS_ACTIVE.example,
            createdAt: SWAGGER_PROPERTIES.CREATED_AT.example,
            studentId: 1,
            grade: SWAGGER_PROPERTIES.GRADE_6_12.example,
            school: null, // có thể null
            studentPhone: null, // có thể null
            parentPhone: null, // có thể null
        },
    })
    declare data: StudentResponseDto;
}
