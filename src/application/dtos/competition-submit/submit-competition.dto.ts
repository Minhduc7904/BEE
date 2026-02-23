// src/application/dtos/competition-submit/submit-competition.dto.ts
import { IsInt, IsPositive } from 'class-validator'

export class SubmitCompetitionDto {
    @IsInt()
    @IsPositive()
    competitionSubmitId: number
}
