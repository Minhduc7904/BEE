import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator'
import { IsOptionalBoolean, IsOptionalIdNumber, IsOptionalInt } from 'src/shared/decorators/validate'

export class StudentHomeworkSubmitListQueryDto {
  @IsOptionalInt('Trang', 1)
  page?: number = 1

  @IsOptionalInt('Số bản ghi mỗi trang', 1, 100)
  limit?: number = 10

  @IsOptional()
  @IsString()
  sortBy?: string = 'submitAt'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'

  @IsOptionalIdNumber('ID nội dung bài tập')
  homeworkContentId?: number

  @IsOptionalIdNumber('ID cuộc thi')
  competitionId?: number

  @IsOptionalIdNumber('ID người chấm')
  graderId?: number

  @IsOptionalBoolean('Trạng thái đã chấm')
  isGraded?: boolean

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
