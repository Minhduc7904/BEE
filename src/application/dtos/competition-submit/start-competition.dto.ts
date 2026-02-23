// src/application/dtos/competition-submit/start-competition.dto.ts
import { IsInt, IsPositive } from 'class-validator'

export class StartCompetitionDto {
    @IsInt()
    @IsPositive()
    competitionId: number
}
