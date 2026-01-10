import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class UpdateCourseClassDto {
  @IsOptional()
  @IsString({ message: 'Tên lớp học phải là chuỗi ký tự' })
  @MinLength(3, { message: 'Tên lớp học phải có ít nhất 3 ký tự' })
  @MaxLength(100, { message: 'Tên lớp học không được vượt quá 100 ký tự' })
  @Trim()
  className?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải là định dạng ngày hợp lệ' })
  startDate?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày hợp lệ' })
  endDate?: string | null;

  @IsOptional()
  @IsString({ message: 'Phòng học phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Phòng học không được vượt quá 100 ký tự' })
  @Trim()
  room?: string | null;

  @IsOptional()
  @IsInt({ message: 'ID giáo viên phải là số nguyên' })
  @Min(1, { message: 'ID giáo viên phải lớn hơn 0' })
  instructorId?: number | null;
}
