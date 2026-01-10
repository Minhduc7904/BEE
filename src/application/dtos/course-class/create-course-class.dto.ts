import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class CreateCourseClassDto {
  @IsInt({ message: 'ID khóa học phải là số nguyên' })
  @Min(1, { message: 'ID khóa học phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID khóa học không được để trống' })
  courseId: number;

  @IsString({ message: 'Tên lớp học phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên lớp học không được để trống' })
  @MinLength(3, { message: 'Tên lớp học phải có ít nhất 3 ký tự' })
  @MaxLength(100, { message: 'Tên lớp học không được vượt quá 100 ký tự' })
  @Trim()
  className: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải là định dạng ngày hợp lệ' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày hợp lệ' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'Phòng học phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Phòng học không được vượt quá 100 ký tự' })
  @Trim()
  room?: string;

  @IsOptional()
  @IsInt({ message: 'ID giáo viên phải là số nguyên' })
  @Min(1, { message: 'ID giáo viên phải lớn hơn 0' })
  instructorId?: number;
}
