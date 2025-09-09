// src/application/dtos/student/student-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ListQueryDto } from '../pagination/list-query.dto';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';

export class StudentListQueryDto extends ListQueryDto {
    @ApiPropertyOptional(SWAGGER_PROPERTIES.GRADE)
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Lớp') })
    @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Lớp', 1) })
    @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Lớp', 12) })
    grade?: number;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.SCHOOL)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên trường') })
    school?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.STUDENT_PHONE)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại học sinh') })
    studentPhone?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.PARENT_PHONE)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại phụ huynh') })
    parentPhone?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.USERNAME)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Username') })
    username?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.EMAIL)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    email?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.FIRST_NAME)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
    firstName?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.LAST_NAME)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
    lastName?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.IS_ACTIVE)
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái hoạt động') })
    isActive?: boolean;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.CREATED_AFTER)
    @IsOptional()
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày tạo từ') })
    createdAfter?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.CREATED_BEFORE)
    @IsOptional()
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày tạo đến') })
    createdBefore?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.LAST_LOGIN_AFTER)
    @IsOptional()
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày đăng nhập từ') })
    lastLoginAfter?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.LAST_LOGIN_BEFORE)
    @IsOptional()
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày đăng nhập đến') })
    lastLoginBefore?: string;

    /**
     * Chuyển đổi DTO thành filter options cho repository
     */
    toStudentFilterOptions() {
        return {
            grade: this.grade,
            school: this.school,
            studentPhone: this.studentPhone,
            parentPhone: this.parentPhone,
            username: this.username,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            isActive: this.isActive,
            createdAfter: this.createdAfter ? new Date(this.createdAfter) : undefined,
            createdBefore: this.createdBefore ? new Date(this.createdBefore) : undefined,
            lastLoginAfter: this.lastLoginAfter ? new Date(this.lastLoginAfter) : undefined,
            lastLoginBefore: this.lastLoginBefore ? new Date(this.lastLoginBefore) : undefined,
            search: this.search // Sử dụng flat property từ ListQueryDto
        };
    }

    /**
     * Chuyển đổi thành pagination options cho repository
     */
    toStudentPaginationOptions() {
        const sortField = this.sortBy || 'createdAt'; // Sử dụng flat property
        const sortDirection = this.sortOrder || 'desc'; // Sử dụng flat property

        // Validate sort field
        const allowedSortFields = [
            'studentId', 'userId', 'grade', 'school',
            'username', 'email', 'firstName', 'lastName',
            'createdAt', 'updatedAt', 'lastLoginAt'
        ];

        const validSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt';

        return {
            page: this.page || 1, // Sử dụng flat property
            limit: this.limit || 10, // Sử dụng flat property
            sortBy: {
                field: validSortField as any,
                direction: sortDirection
            }
        };
    }

    /**
     * Validate sort field
     */
    validateStudentSortFields(): boolean {
        const allowedFields = [
            'studentId', 'userId', 'grade', 'school',
            'username', 'email', 'firstName', 'lastName',
            'createdAt', 'updatedAt', 'lastLoginAt'
        ];

        if (!this.sortBy) return true; // Sử dụng flat property
        return allowedFields.includes(this.sortBy);
    }

    /**
     * Validate date ranges
     */
    validateDateRanges(): string[] {
        const errors: string[] = [];

        if (this.createdAfter && this.createdBefore) {
            const from = new Date(this.createdAfter);
            const to = new Date(this.createdBefore);
            if (from > to) {
                errors.push('Ngày tạo từ phải nhỏ hơn hoặc bằng ngày tạo đến');
            }
        }

        if (this.lastLoginAfter && this.lastLoginBefore) {
            const from = new Date(this.lastLoginAfter);
            const to = new Date(this.lastLoginBefore);
            if (from > to) {
                errors.push('Ngày đăng nhập từ phải nhỏ hơn hoặc bằng ngày đăng nhập đến');
            }
        }

        return errors;
    }
}
