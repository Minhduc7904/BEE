import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../shared/decorators';

export class UpdateCourseEnrollmentDto {
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Trạng thái không được vượt quá 50 ký tự' })
  @Trim()
  status?: string;
}
