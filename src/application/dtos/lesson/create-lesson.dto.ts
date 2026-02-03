// src/application/dtos/lesson/create-lesson.dto.ts
import { MinLength } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Visibility } from '../../../shared/enums'
import { 
  IsRequiredIdNumber,
  IsRequiredString,
  IsOptionalString,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalIdNumber,
  IsOptionalBoolean,
  IsOptionalIntArray
} from 'src/shared/decorators/validate'

/**
 * DTO for creating a new lesson
 * 
 * Required fields:
 * - Course ID (Khóa học)
 * - Title (Tiêu đề bài học)
 * 
 * Optional fields:
 * - Description (Mô tả)
 * - Visibility (Trạng thái hiển thị)
 * - Order in Course (Thứ tự bài học)
 * - Teacher ID (Giáo viên)
 * - Allow Trial (Cho phép học thử)
 * - Chapter IDs (Danh sách chương)
 */
export class CreateLessonDto {
  // Course information
  /**
   * Course ID that this lesson belongs to
   * @required
   */
  @IsRequiredIdNumber('Khóa học')
  courseId: number

  // Lesson information
  /**
   * Lesson title
   * @required
   * @minLength 3
   * @maxLength 200
   */
  @IsRequiredString('Tiêu đề bài học', 200)
  @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Tiêu đề bài học', 3) })
  title: string

  /**
   * Lesson description
   * @optional
   */
  @IsOptionalString('Mô tả')
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
   * @default false
   */
  @IsOptionalBoolean('Cho phép học thử')
  allowTrial?: boolean = false

  /**
   * List of chapter IDs associated with this lesson
   * @optional
   */
  @IsOptionalIntArray('Danh sách chương')
  chapterIds?: number[]
}
