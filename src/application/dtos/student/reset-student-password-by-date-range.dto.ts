import { IsDateString } from 'class-validator'

export class ResetStudentPasswordByDateRangeDto {
  @IsDateString({}, { message: 'fromDate phải là ngày hợp lệ dạng YYYY-MM-DD hoặc ISO datetime' })
  fromDate: string

  @IsDateString({}, { message: 'toDate phải là ngày hợp lệ dạng YYYY-MM-DD hoặc ISO datetime' })
  toDate: string
}
