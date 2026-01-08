import { IsInt, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Min } from 'class-validator';
import { Trim } from '../../../shared/decorators';

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
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Trạng thái không được vượt quá 50 ký tự' })
  @Trim()
  status?: string;
}
