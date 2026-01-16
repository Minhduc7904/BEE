import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim, IsEnumValue } from '../../../shared/decorators';
import { CourseEnrollmentStatus } from 'src/shared/enums';

export class UpdateCourseEnrollmentDto {
  @IsOptional()
  @MaxLength(50, { message: 'Trạng thái không được vượt quá 50 ký tự' })
  @Trim()
  @IsEnumValue(CourseEnrollmentStatus, { message: 'Trạng thái không hợp lệ' })
  status?: CourseEnrollmentStatus;
}
