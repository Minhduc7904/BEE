import { IsOptionalString, IsRequiredNumber } from 'src/shared/decorators/validate'

export class GradeStudentFileHomeworkDto {
  @IsRequiredNumber('Điểm số', 0, 100)
  points: number

  @IsOptionalString('Nhận xét')
  feedback?: string
}
