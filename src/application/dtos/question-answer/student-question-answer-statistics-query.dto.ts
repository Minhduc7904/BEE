import { IsOptionalString } from 'src/shared/decorators/validate'

export class StudentQuestionAnswerStatisticsQueryDto {
  @IsOptionalString('Từ ngày', 20)
  fromDate?: string

  @IsOptionalString('Đến ngày', 20)
  toDate?: string
}
