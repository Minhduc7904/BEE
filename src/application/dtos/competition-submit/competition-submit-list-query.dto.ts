// src/application/dtos/competition-submit/competition-submit-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsEnum, IsBoolean, IsDateString } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'

export class CompetitionSubmitListQueryDto {
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

    @IsOptional()
    sortBy?: string = 'startedAt'

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'

    /** Lọc theo cuộc thi */
    @IsOptional()
    @IsInt()
    @ToNumber()
    competitionId?: number

    /** Lọc theo học sinh */
    @IsOptional()
    @IsInt()
    @ToNumber()
    studentId?: number

    /** Lọc theo trạng thái bài nộp */
    @IsOptional()
    @IsEnum(CompetitionSubmitStatus)
    status?: CompetitionSubmitStatus

    /** Lọc theo lần làm */
    @IsOptional()
    @IsInt()
    @ToNumber()
    attemptNumber?: number

    /** Chỉ lấy những bài đã chấm */
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isGraded?: boolean

    /** Lọc từ ngày bắt đầu làm */
    @IsOptional()
    @IsDateString()
    startedFrom?: string

    /** Lọc đến ngày bắt đầu làm */
    @IsOptional()
    @IsDateString()
    startedTo?: string
}
