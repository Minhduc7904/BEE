import { IsOptional, IsInt, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../pagination/list-query.dto';
import {
  CourseEnrollmentFilterOptions,
  CourseEnrollmentPaginationOptions,
} from 'src/domain/interface/course-enrollment/course-enrollment.interface';
import { CourseEnrollmentStatus } from 'src/shared/enums';

export class CourseEnrollmentListQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID khóa học phải là số nguyên' })
  courseId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  studentId?: number;

  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  status?: CourseEnrollmentStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày đăng ký từ phải là định dạng ngày hợp lệ' })
  enrolledAtFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày đăng ký đến phải là định dạng ngày hợp lệ' })
  enrolledAtTo?: string;

  toCourseEnrollmentFilterOptions(): CourseEnrollmentFilterOptions {
    return {
      courseId: this.courseId,
      studentId: this.studentId,
      status: this.status,
      search: this.search,
      enrolledAtFrom: this.enrolledAtFrom ? new Date(this.enrolledAtFrom) : undefined,
      enrolledAtTo: this.enrolledAtTo ? new Date(this.enrolledAtTo) : undefined,
    };
  }

  toCourseEnrollmentPaginationOptions(): CourseEnrollmentPaginationOptions {
    const allowedSortFields = [
      'enrollmentId',
      'courseId',
      'studentId',
      'enrolledAt',
      'status',
    ];

    const sortBy = allowedSortFields.includes(this.sortBy || '')
      ? this.sortBy
      : 'enrolledAt';

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy,
      sortOrder: this.sortOrder,
    };
  }
}
