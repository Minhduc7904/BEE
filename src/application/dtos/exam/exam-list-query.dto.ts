// src/application/dtos/exam/exam-list-query.dto.ts
import { IsOptionalIdNumber, IsOptionalInt, IsOptionalEnumValue } from '../../../shared/decorators/validate'
import { ExamVisibility, TypeOfExam } from '../../../shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

export class ExamListQueryDto extends ListQueryDto {
  /**
   * Lọc theo môn học
   * @example 5
   */
  @IsOptionalIdNumber('ID môn học')
  subjectId?: number

  /**
   * Lọc theo khối lớp (1-12)
   * @example 10
   */
  @IsOptionalInt('Khối lớp', 1, 12)
  grade?: number

  /**
   * Lọc theo loại đề thi
   * @example "GK1"
   */
  @IsOptionalEnumValue(TypeOfExam, 'Loại đề thi')
  typeOfExam?: TypeOfExam

  /**
   * Lọc theo trạng thái hiển thị
   * @example "PUBLISHED"
   */
  @IsOptionalEnumValue(ExamVisibility, 'Trạng thái hiển thị')
  visibility?: ExamVisibility

  /**
   * Lọc theo người tạo
   * @example 1
   */
  @IsOptionalIdNumber('ID người tạo')
  createdBy?: number
}
