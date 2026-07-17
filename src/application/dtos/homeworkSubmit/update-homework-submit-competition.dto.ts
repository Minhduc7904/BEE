import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator'
import { CompetitionSubmitSelection } from './create-homework-submit-from-competition.dto'

export class UpdateHomeworkSubmitCompetitionDto {
  @IsOptional()
  @IsEnum(CompetitionSubmitSelection)
  selection: CompetitionSubmitSelection = CompetitionSubmitSelection.LATEST

  @ValidateIf((dto) => dto.selection === CompetitionSubmitSelection.SPECIFIC)
  @IsInt()
  @Min(1)
  competitionSubmitId?: number

  @IsOptional()
  @IsBoolean()
  autoFeedback: boolean = true

  @ValidateIf((dto) => dto.autoFeedback === false)
  @IsString()
  @MinLength(1)
  manualFeedback?: string
}
