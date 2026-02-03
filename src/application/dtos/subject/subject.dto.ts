import { Subject } from '../../../domain/entities/subject/subject.entity'
import { IsRequiredString, IsOptionalString } from 'src/shared/decorators/validate'
import { MinLength } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

/**
 * DTO for creating a new subject
 * 
 * Required fields:
 * - Name (Tên môn học)
 * 
 * Optional fields:
 * - Code (Mã môn học)
 */
export class CreateSubjectDto {
  /**
   * Subject name
   * @required
   * @minLength 2
   * @maxLength 100
   */
  @IsRequiredString('Tên môn học', 100, 2)
  name: string

  /**
   * Subject code (optional identifier)
   * @optional
   * @maxLength 50
   */
  @IsOptionalString('Mã môn học', 50)
  code?: string
}

/**
 * DTO for updating an existing subject
 * All fields are optional - only provided fields will be updated
 */
export class UpdateSubjectDto {
  /**
   * Subject name
   * @optional
   * @minLength 2
   * @maxLength 100
   */
  @IsOptionalString('Tên môn học', 100)
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Tên môn học', 2) })
  name?: string

  /**
   * Subject code
   * @optional
   * @maxLength 50
   */
  @IsOptionalString('Mã môn học', 50)
  code?: string
}

/**
 * Response DTO for subject data
 */
export class SubjectResponseDto {
  /**
   * Subject unique identifier
   */
  subjectId: number

  /**
   * Subject name
   */
  name: string

  /**
   * Subject code (optional)
   */
  code?: string | null

  /**
   * Total number of chapters in this subject
   */
  chaptersCount?: number

  static fromSubject(subject: Subject): SubjectResponseDto {
    return {
      subjectId: subject.subjectId,
      name: subject.name,
      code: subject.code,
      chaptersCount: subject.getChaptersCount(),
    }
  }

  static fromSubjectList(subjects: Subject[]): SubjectResponseDto[] {
    return subjects.map((subject) => this.fromSubject(subject))
  }
}

/**
 * Detailed response DTO for subject with chapters
 */
export class SubjectDetailResponseDto extends SubjectResponseDto {
  /**
   * List of chapters in this subject
   */
  chapters?: any[]

  static fromSubjectWithChapters(subject: Subject): SubjectDetailResponseDto {
    return {
      ...SubjectResponseDto.fromSubject(subject),
      chapters: subject.chapters,
    }
  }
}
