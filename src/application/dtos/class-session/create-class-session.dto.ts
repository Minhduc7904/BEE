import {
  IsInt,
  IsNotEmpty,
  IsDateString,
  IsString,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateClassSessionDto {
  @IsInt({ message: 'ID lớp học phải là số nguyên' })
  @Min(1, { message: 'ID lớp học phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID lớp học không được để trống' })
  classId: number;

  @IsString({ message: 'Tên buổi học phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên buổi học không được để trống' })
  @MaxLength(200, { message: 'Tên buổi học không được vượt quá 200 ký tự' })
  name: string;

  @IsDateString({}, { message: 'Ngày học phải là định dạng ngày hợp lệ' })
  @IsNotEmpty({ message: 'Ngày học không được để trống' })
  sessionDate: string;

  @IsDateString({}, { message: 'Giờ bắt đầu phải là định dạng thời gian hợp lệ' })
  @IsNotEmpty({ message: 'Giờ bắt đầu không được để trống' })
  startTime: string;

  @IsDateString({}, { message: 'Giờ kết thúc phải là định dạng thời gian hợp lệ' })
  @IsNotEmpty({ message: 'Giờ kết thúc không được để trống' })
  endTime: string;

  @IsString({ message: 'Ghi chú học bù phải là chuỗi' })
  @IsOptional()
  makeupNote?: string;
}
