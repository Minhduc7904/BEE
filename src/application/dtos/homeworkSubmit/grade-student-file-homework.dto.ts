import { IsOptionalNumber, IsOptionalString } from 'src/shared/decorators/validate'

export class GradeStudentFileHomeworkDto {
  @IsOptionalNumber('Điểm số', 0, 100)
  points?: number

  @IsOptionalString('Nhận xét')
  feedback?: string
}
