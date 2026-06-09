import { ArrayNotEmpty } from 'class-validator'
import { IsRequiredInt, IsRequiredIntArray } from 'src/shared/decorators/validate'

export class HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto {
  /**
   * Năm tốt nghiệp cấp 3 của học sinh cần xóa.
   * @required
   * @example 2026
   */
  @IsRequiredInt('Năm tốt nghiệp cấp 3', 1900, 2100)
  highSchoolGraduationYear: number

  /**
   * Khối lớp của học sinh cần xóa.
   * @required
   * @example 12
   */
  @IsRequiredInt('Khối lớp', 1, 12)
  grade: number

  /**
   * Danh sách course ID dùng để bảo vệ học sinh đang tham gia.
   * Chỉ xóa học sinh không có enrollment và không nằm trong lớp của bất kỳ khóa học nào trong danh sách này.
   * @required
   * @example [1, 2, 3]
   */
  @IsRequiredIntArray('Danh sách ID khóa học')
  @ArrayNotEmpty({ message: 'Danh sách ID khóa học không được để trống' })
  courseIds: number[]
}
