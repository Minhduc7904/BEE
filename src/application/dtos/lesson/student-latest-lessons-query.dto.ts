import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { ToNumber } from '../../../shared/decorators'

export class StudentLatestLessonsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @ToNumber()
  page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @ToNumber()
  limit?: number = 10
}
