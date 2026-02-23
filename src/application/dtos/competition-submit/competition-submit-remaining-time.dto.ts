// src/application/dtos/competition-submit/competition-submit-remaining-time.dto.ts
export class CompetitionSubmitRemainingTimeDto {
    competitionSubmitId: number
    totalMinutes?: number
    elapsedMinutes: number
    remainingMinutes?: number
    isOverTime: boolean
    formattedRemaining: string
    formattedElapsed: string
    
    constructor(
        competitionSubmitId: number,
        totalMinutes: number | undefined,
        elapsedMinutes: number,
        remainingMinutes: number | undefined,
        isOverTime: boolean,
        formattedRemaining: string,
        formattedElapsed: string
    ) {
        this.competitionSubmitId = competitionSubmitId
        this.totalMinutes = totalMinutes
        this.elapsedMinutes = elapsedMinutes
        this.remainingMinutes = remainingMinutes
        this.isOverTime = isOverTime
        this.formattedRemaining = formattedRemaining
        this.formattedElapsed = formattedElapsed
    }
}
