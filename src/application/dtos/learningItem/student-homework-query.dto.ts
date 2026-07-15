import { HomeworkContentType } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import {
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsOptionalInt,
  IsOptionalString,
} from 'src/shared/decorators/validate'

export enum HomeworkStatus {
  ALL = 'ALL',
  INCOMPLETE = 'INCOMPLETE',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export enum StudentHomeworkSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

/** Query của GET /learning-items/student/my-homeworks. */
export class StudentHomeworkQueryDto {
  @IsOptionalInt('Trang', 1)
  page?: number = 1

  @IsOptionalInt('Số phần tử mỗi trang', 1, 100)
  limit?: number = 10

  @IsOptionalEnumValue(StudentHomeworkSortBy, 'Trường sắp xếp')
  sortBy?: StudentHomeworkSortBy = StudentHomeworkSortBy.CREATED_AT

  @IsOptionalEnumValue(SortOrder, 'Thứ tự sắp xếp')
  sortOrder?: SortOrder = SortOrder.DESC

  @IsOptionalEnumValue(HomeworkStatus, 'Trạng thái bài tập')
  status?: HomeworkStatus = HomeworkStatus.ALL

  @IsOptionalString('Từ khóa tìm kiếm', 255)
  search?: string

  @IsOptionalIdNumber('ID khóa học')
  courseId?: number

  @IsOptionalIdNumber('ID bài học')
  lessonId?: number

  /** Lọc loại nội dung bài tập; bỏ trống để lấy cả COMPETITION và FILE_UPLOAD. */
  @IsOptionalEnumValue(HomeworkContentType, 'Loại nội dung bài tập')
  homeworkType?: HomeworkContentType
}
