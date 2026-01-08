import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Subject } from '../../../domain/entities/subject/subject.entity'

export class CreateSubjectDto {
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên môn học') })
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN('Tên môn học', 2) })
  @MaxLength(100, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên môn học', 100) })
  name: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mã môn học') })
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Mã môn học', 50) })
  code?: string
}

export class UpdateSubjectDto {
  @Trim()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string
}

export class SubjectResponseDto {
  subjectId: number
  name: string
  code?: string | null
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

export class SubjectDetailResponseDto extends SubjectResponseDto {
  chapters?: any[]

  static fromSubjectWithChapters(subject: Subject): SubjectDetailResponseDto {
    return {
      ...SubjectResponseDto.fromSubject(subject),
      chapters: subject.chapters,
    }
  }
}
