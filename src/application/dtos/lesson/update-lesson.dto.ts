// src/application/dtos/lesson/update-lesson.dto.ts
import { MinLength } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Visibility } from '../../../shared/enums'
import { 
  IsOptionalString,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalIdNumber,
  IsOptionalBoolean,
  IsOptionalIntArray
} from 'src/shared/decorators/validate'

/**
 * DTO for updating an existing lesson
 * All fields are optional - only provided fields will be updated
 */
export class UpdateLessonDto {
  // Lesson information
  /**
   * Lesson title
   * @optional
   * @minLength 3
   * @maxLength 200
   */
  @IsOptionalString('Tiêu đề bài học', 200, 3)
  title?: string

  /**
   * Lesson description
   * @optional
   */
  @IsOptionalString('Mô tả', 500)
  description?: string

  /**
   * Lesson visibility status
   * @optional
   */
  @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
  visibility?: Visibility

  /**
   * Order position in course
   * @optional
   * @min 0
   */
  @IsOptionalInt('Thứ tự bài học', 0)
  orderInCourse?: number

  /**
   * Teacher ID assigned to this lesson
   * @optional
   */
  @IsOptionalIdNumber('Giáo viên')
  teacherId?: number

  /**
   * Allow students to trial this lesson
   * @optional
   */
  @IsOptionalBoolean('Cho phép học thử')
  allowTrial?: boolean

  /**
   * List of chapter IDs associated with this lesson
   * @optional
   */
  @IsOptionalIntArray('Danh sách chương')
  chapterIds?: number[]
}
