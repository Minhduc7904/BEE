// src/application/dtos/student/student-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ListQueryDto } from '../pagination/list-query.dto';

export class StudentListQueryDto extends ListQueryDto {
    @ApiPropertyOptional({
        description: 'Lọc theo lớp',
        example: 12,
        minimum: 1,
        maximum: 12
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Lớp phải là số' })
    @Min(1, { message: 'Lớp tối thiểu là 1' })
    @Max(12, { message: 'Lớp tối đa là 12' })
    grade?: number;

    @ApiPropertyOptional({
        description: 'Lọc theo trường học',
        example: 'THPT Nguyễn Huệ'
    })
    @IsOptional()
    @IsString({ message: 'Tên trường phải là chuỗi' })
    school?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo số điện thoại học sinh',
        example: '0123456789'
    })
    @IsOptional()
    @IsString({ message: 'Số điện thoại học sinh phải là chuỗi' })
    studentPhone?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo số điện thoại phụ huynh',
        example: '0987654321'
    })
    @IsOptional()
    @IsString({ message: 'Số điện thoại phụ huynh phải là chuỗi' })
    parentPhone?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo username',
        example: 'student01'
    })
    @IsOptional()
    @IsString({ message: 'Username phải là chuỗi' })
    username?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo email',
        example: 'student@example.com'
    })
    @IsOptional()
    @IsString({ message: 'Email phải là chuỗi' })
    email?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo tên',
        example: 'Nguyễn'
    })
    @IsOptional()
    @IsString({ message: 'Tên phải là chuỗi' })
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo họ',
        example: 'Văn A'
    })
    @IsOptional()
    @IsString({ message: 'Họ phải là chuỗi' })
    lastName?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái hoạt động',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Lọc từ ngày tạo (ISO 8601)',
        example: '2024-01-01T00:00:00.000Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày tạo từ phải có định dạng ISO 8601' })
    createdAfter?: string;

    @ApiPropertyOptional({
        description: 'Lọc đến ngày tạo (ISO 8601)',
        example: '2024-12-31T23:59:59.999Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày tạo đến phải có định dạng ISO 8601' })
    createdBefore?: string;

    @ApiPropertyOptional({
        description: 'Lọc từ ngày đăng nhập cuối (ISO 8601)',
        example: '2024-01-01T00:00:00.000Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày đăng nhập từ phải có định dạng ISO 8601' })
    lastLoginAfter?: string;

    @ApiPropertyOptional({
        description: 'Lọc đến ngày đăng nhập cuối (ISO 8601)',
        example: '2024-12-31T23:59:59.999Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày đăng nhập đến phải có định dạng ISO 8601' })
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
