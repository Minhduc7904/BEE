import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'

export class UpdateCompetitionSubmitDto {
    @IsOptional()
    @IsEnum(CompetitionSubmitStatus)
    status?: CompetitionSubmitStatus

    @IsOptional()
    @IsDateString()
    submittedAt?: string

    @IsOptional()
    @IsDateString()
    gradedAt?: string

    @IsOptional()
    @IsNumber()
    totalPoints?: number

    @IsOptional()
    @IsNumber()
    maxPoints?: number

    @IsOptional()
    @IsNumber()
    @Min(0)
    timeSpentSeconds?: number

    @IsOptional()
    metadata?: any
}
