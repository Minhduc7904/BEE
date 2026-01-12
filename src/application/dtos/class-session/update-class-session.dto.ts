import {
  IsOptional,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateClassSessionDto {
  @IsOptional()
  @IsString({ message: 'Tên buổi học phải là chuỗi' })
  @MaxLength(200, { message: 'Tên buổi học không được vượt quá 200 ký tự' })
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày học phải là định dạng ngày hợp lệ' })
  sessionDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Giờ bắt đầu phải là định dạng thời gian hợp lệ' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Giờ kết thúc phải là định dạng thời gian hợp lệ' })
  endTime?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú học bù phải là chuỗi' })
  makeupNote?: string;
}
