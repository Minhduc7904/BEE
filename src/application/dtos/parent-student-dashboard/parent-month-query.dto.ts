import { IsRequiredInt } from '../../../shared/decorators/validate'

export class ParentMonthQueryDto {
  @IsRequiredInt('Tháng', 1, 12)
  month: number

  @IsRequiredInt('Năm', 2000, 2100)
  year: number
}
