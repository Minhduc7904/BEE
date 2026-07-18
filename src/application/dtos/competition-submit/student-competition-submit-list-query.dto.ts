import { IsDateString, IsEnum, IsIn, IsOptional, IsString } from 'class-validator'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { IsOptionalBoolean, IsOptionalIdNumber, IsOptionalInt } from '../../../shared/decorators/validate'

/**
 * Query parameters for the administrator view of one student's competition submissions.
 * The student is identified by the route parameter, therefore studentId is intentionally
 * not accepted here and cannot be overridden by a query string.
 */
export class StudentCompetitionSubmitListQueryDto {
  @IsOptionalInt('Trang', 1)
  page?: number = 1

  @IsOptionalInt('Số bản ghi mỗi trang', 1, 100)
  limit?: number = 10

  @IsOptional()
  @IsString()
  sortBy?: string = 'startedAt'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'

  @IsOptionalIdNumber('ID cuộc thi')
  competitionId?: number

  @IsOptionalIdNumber('ID người chấm')
  graderId?: number

  @IsOptional()
  @IsEnum(CompetitionSubmitStatus)
  status?: CompetitionSubmitStatus

  @IsOptionalBoolean('Trạng thái đã chấm')
  isGraded?: boolean

  @IsOptional()
  @IsDateString()
  startedFrom?: string

  @IsOptional()
  @IsDateString()
  startedTo?: string

  @IsOptional()
  @IsDateString()
  submittedFrom?: string

  @IsOptional()
  @IsDateString()
  submittedTo?: string

  @IsOptional()
  @IsString()
  search?: string
}
