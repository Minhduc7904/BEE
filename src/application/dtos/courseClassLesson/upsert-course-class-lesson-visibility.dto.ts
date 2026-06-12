import {
  IsOptionalDate,
  IsOptionalInt,
  IsRequiredBoolean,
  IsRequiredIdNumber,
} from 'src/shared/decorators/validate'

export class UpsertCourseClassLessonVisibilityDto {
  @IsRequiredIdNumber('ID lớp học')
  classId: number

  @IsRequiredIdNumber('ID bài học')
  lessonId: number

  @IsRequiredBoolean('Trạng thái hiển thị')
  isVisible: boolean

  @IsOptionalInt('Thứ tự hiển thị', 0)
  displayOrder?: number | null

  @IsOptionalDate('Thời gian bắt đầu hiển thị')
  availableFrom?: string | null

  @IsOptionalDate('Thời gian kết thúc hiển thị')
  availableUntil?: string | null
}
