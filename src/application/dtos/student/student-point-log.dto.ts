import { IsObject, IsOptional } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { PaginationMetaDto, PaginationResponseDto } from '../pagination/pagination-response.dto'
import {
  IsOptionalEnumValue,
  IsOptionalNumber,
  IsOptionalString,
  IsRequiredEnumValue,
  IsRequiredIdNumber,
  IsRequiredNumber,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import type {
  StudentPointLogFilterOptions,
  StudentPointLogPaginationOptions,
} from 'src/domain/repositories/student-point-log.repository'
import { StudentPointLog } from 'src/domain/entities'
import { PointType } from 'src/shared/enums'
import { StudentResponseDto } from './student.dto'

export class StudentPointLogListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(PointType, 'Loai diem')
  type?: PointType

  @IsOptionalString('Nguon diem', 50)
  source?: string

  @IsOptionalString('Loai tham chieu', 50)
  referenceType?: string

  @IsOptionalNumber('ID tham chieu', 1)
  referenceId?: number

  toFilterOptions(studentId: number): StudentPointLogFilterOptions {
    return {
      studentId,
      type: this.type,
      source: this.source,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      search: this.search,
      fromDate: this.fromDate,
      toDate: this.toDate,
    }
  }

  toPaginationOptions(): StudentPointLogPaginationOptions {
    const allowedSortFields = ['pointLogId', 'points', 'type', 'source', 'createdAt']
    const sortBy = allowedSortFields.includes(this.sortBy || '') ? this.sortBy : 'createdAt'

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy,
      sortOrder: this.sortOrder,
    }
  }
}

export class CreateStudentPointLogDto {
  @IsRequiredIdNumber('ID hoc sinh')
  studentId: number

  @IsRequiredEnumValue(PointType, 'Loai diem')
  type: PointType

  @IsRequiredNumber('Diem so', 0)
  points: number

  @IsRequiredString('Nguon diem', 50)
  source: string

  @IsOptionalString('Loai tham chieu', 50)
  referenceType?: string

  @IsOptionalNumber('ID tham chieu', 1)
  referenceId?: number

  @IsOptionalString('Ghi chu', 255)
  note?: string

  @IsOptional()
  @IsObject({ message: 'Metadata phai la object' })
  metadata?: Record<string, any>
}

export class UpdateStudentPointLogDto {
  @IsOptionalEnumValue(PointType, 'Loai diem')
  type?: PointType

  @IsOptionalNumber('Diem so', 0)
  points?: number

  @IsOptionalString('Nguon diem', 50)
  source?: string

  @IsOptionalString('Loai tham chieu', 50)
  referenceType?: string

  @IsOptionalNumber('ID tham chieu', 1)
  referenceId?: number

  @IsOptionalString('Ghi chu', 255)
  note?: string

  @IsOptional()
  @IsObject({ message: 'Metadata phai la object' })
  metadata?: Record<string, any>
}

export class StudentPointLogResponseDto {
  pointLogId: number
  studentId: number
  type: PointType
  points: number
  signedPoints: number
  source: string
  referenceType?: string
  referenceId?: number
  note?: string
  metadata?: Record<string, any>
  createdAt: Date
  student?: StudentResponseDto | null

  static fromEntity(entity: StudentPointLog): StudentPointLogResponseDto {
    const dto = new StudentPointLogResponseDto()
    dto.pointLogId = entity.pointLogId
    dto.studentId = entity.studentId
    dto.type = entity.type
    dto.points = entity.points
    dto.signedPoints = entity.getSignedPoints()
    dto.source = entity.source
    dto.referenceType = entity.referenceType
    dto.referenceId = entity.referenceId
    dto.note = entity.note
    dto.metadata = entity.metadata
    dto.createdAt = entity.createdAt
    dto.student = entity.student ? StudentResponseDto.fromStudentEntity(entity.student) : null
    return dto
  }

  static fromEntities(entities: StudentPointLog[]): StudentPointLogResponseDto[] {
    return entities.map((entity) => StudentPointLogResponseDto.fromEntity(entity))
  }
}

export class StudentPointLogMutationResponseDto {
  pointLog: StudentPointLogResponseDto
  totalPoint: number

  constructor(pointLog: StudentPointLog, totalPoint: number) {
    this.pointLog = StudentPointLogResponseDto.fromEntity(pointLog)
    this.totalPoint = totalPoint
  }
}

export class DeleteStudentPointLogResponseDto {
  deleted: boolean
  deletedPointLog: StudentPointLogResponseDto
  totalPoint: number

  constructor(deletedPointLog: StudentPointLog, totalPoint: number) {
    this.deleted = true
    this.deletedPointLog = StudentPointLogResponseDto.fromEntity(deletedPointLog)
    this.totalPoint = totalPoint
  }
}

export class StudentPointLogListResponseDto extends PaginationResponseDto<StudentPointLogResponseDto> {
  totalPoint: number

  constructor(
    logs: StudentPointLog[],
    page: number,
    limit: number,
    total: number,
    totalPoint: number,
  ) {
    super(
      true,
      'Lay danh sach log diem thanh cong',
      StudentPointLogResponseDto.fromEntities(logs),
      new PaginationMetaDto(page, limit, total),
    )
    this.totalPoint = totalPoint
  }
}
