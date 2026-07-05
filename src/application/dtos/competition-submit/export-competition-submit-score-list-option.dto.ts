import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'
import { IsOptionalBoolean } from 'src/shared/decorators/validate'
import { CompetitionSubmitStatus } from 'src/shared/enums'
import { ExportStudentListOptionDto } from '../student/export-student-list-option.dto'

export class ExportCompetitionSubmitScoreListOptionDto extends ExportStudentListOptionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @ToNumber()
  limit?: number = 10000

  @IsOptional()
  @IsInt()
  @ToNumber()
  competitionId?: number

  @IsOptional()
  @IsInt()
  @ToNumber()
  studentId?: number

  @IsOptional()
  @IsEnum(CompetitionSubmitStatus)
  status?: CompetitionSubmitStatus

  @IsOptional()
  @IsInt()
  @ToNumber()
  attemptNumber?: number

  @IsOptionalBoolean('Competition submit da cham diem')
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

  @IsOptionalBoolean('Include competition submit columns')
  includeCompetitionSubmitColumns?: boolean = true

  @IsOptionalBoolean('Include question result columns')
  includeQuestionColumns?: boolean = true

  toCompetitionSubmitFilterOptions() {
    return {
      competitionId: this.competitionId,
      studentId: this.studentId,
      search: this.search,
      status: this.status,
      attemptNumber: this.attemptNumber,
      startedFrom: this.startedFrom ? new Date(this.startedFrom) : undefined,
      startedTo: this.startedTo ? new Date(this.startedTo) : undefined,
      submittedFrom: this.submittedFrom ? new Date(this.submittedFrom) : undefined,
      submittedTo: this.submittedTo ? new Date(this.submittedTo) : undefined,
      isGraded: this.isGraded,
      grade: this.grade,
      highSchoolGraduationYear: this.highSchoolGraduationYear,
      isActive: this.isActive,
      hasParentZaloId: this.hasParentZaloId,
      classIds: this.classIds,
    }
  }

  toCompetitionSubmitPaginationOptions() {
    const sortOrder: 'asc' | 'desc' = this.sortOrder === 'asc' ? 'asc' : 'desc'

    return {
      page: this.page || 1,
      limit: Math.min(10000, this.limit || 10000),
      sortBy: this.sortBy || 'startedAt',
      sortOrder,
    }
  }
}
