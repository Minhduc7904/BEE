import { IsRequiredNumber } from 'src/shared/decorators/validate'

export class UpdateTempQuestionPointsBySectionDto {
  @IsRequiredNumber('Diem goc', 0)
  pointsOrigin: number
}
