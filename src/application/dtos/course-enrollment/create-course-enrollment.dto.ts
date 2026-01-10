import { IsInt, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Min } from 'class-validator';
import { Trim, IsEnumValue } from '../../../shared/decorators';
import { CourseEnrollmentStatus } from '@prisma/client';

export class CreateCourseEnrollmentDto {
  @IsInt({ message: 'ID khóa học phải là số nguyên' })
  @Min(1, { message: 'ID khóa học phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID khóa học không được để trống' })
  courseId: number;

  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  @Min(1, { message: 'ID học sinh phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID học sinh không được để trống' })
  studentId: number;

  @IsOptional()
  @Trim()
  @IsEnumValue(CourseEnrollmentStatus, { message: 'Trạng thái không hợp lệ' })
  status?: CourseEnrollmentStatus;
}
