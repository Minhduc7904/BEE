import { IsOptional, IsInt, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../pagination/list-query.dto'
import {
    CourseClassFilterOptions,
    CourseClassPaginationOptions,
} from '../../../domain/interface/course-class/course-class.interface';
import { Trim, ToBoolean } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class CourseClassListQueryDto extends ListQueryDto {
    @IsOptional()
    @ToNumber()
    @IsInt({ message: 'ID khóa học phải là số nguyên' })
    courseId?: number;

    @IsOptional()
    @ToNumber()
    @IsInt({ message: 'ID giáo viên phải là số nguyên' })
    instructorId?: number;

    @IsOptional()
    @ToNumber()
    @IsInt({ message: 'ID giáo viên phải là số nguyên' })
    teacherId?: number;

    @IsOptional()
    @ToBoolean()
    @IsBoolean({ message: 'isActive phải là boolean' })
    isActive?: boolean;

    @IsOptional()
    @ToBoolean()
    @IsBoolean({ message: 'isUpcoming phải là boolean' })
    isUpcoming?: boolean;

    @IsOptional()
    @ToBoolean()
    @IsBoolean({ message: 'isCompleted phải là boolean' })
    isCompleted?: boolean;

    toCourseClassFilterOptions(): CourseClassFilterOptions {
        return {
            courseId: this.courseId,
            instructorId: this.instructorId,
            teacherId: this.teacherId,
            isActive: this.isActive,
            isUpcoming: this.isUpcoming,
            isCompleted: this.isCompleted,
            search: this.search,
        };
    }

    toCourseClassPaginationOptions(): CourseClassPaginationOptions {
        const sortField = this.sortBy || 'createdAt'
        const sortDirection = this.sortOrder || 'desc'

        // Validate sort field
        const allowedSortFields = [
            'classId',
            'className',
            'startDate',
            'endDate',
            'courseId',
            'instructorId',
        ];

        const validatedSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt'


        return {
            page: this.page || 1,
            limit: this.limit || 10,
            sortBy: validatedSortField,
            sortOrder: sortDirection as 'asc' | 'desc',
        };
    }
}
