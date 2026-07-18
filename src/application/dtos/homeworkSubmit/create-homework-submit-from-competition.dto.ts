import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'

export enum CompetitionSubmitSelection {
  LATEST = 'LATEST',
  OLDEST = 'OLDEST',
  HIGHEST_SCORE = 'HIGHEST_SCORE',
  SPECIFIC = 'SPECIFIC',
}

export class CreateHomeworkSubmitFromCompetitionDto {
  @IsInt()
  @Min(1)
  homeworkContentId: number

  @IsInt()
  @Min(1)
  studentId: number

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
