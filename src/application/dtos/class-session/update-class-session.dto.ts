import {
  IsOptional,
  IsDateString,
} from 'class-validator';

export class UpdateClassSessionDto {
  @IsOptional()
  @IsDateString({}, { message: 'Ngày học phải là định dạng ngày hợp lệ' })
  sessionDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Giờ bắt đầu phải là định dạng thời gian hợp lệ' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Giờ kết thúc phải là định dạng thời gian hợp lệ' })
  endTime?: string;
}
