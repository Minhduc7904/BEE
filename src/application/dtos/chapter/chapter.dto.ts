import { IsOptional, IsString, MaxLength, MinLength, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Chapter } from '../../../domain/entities/chapter/chapter.entity'
import { ToNumber } from 'src/shared/decorators'

export class CreateChapterDto {
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('ID môn học') })
  @ToNumber()
  @Min(1)
  subjectId: number

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên chương') })
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN('Tên chương', 2) })
  @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên chương', 200) })
  name: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mã chương') })
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Mã chương', 50) })
  code?: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Slug') })
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN('Slug', 2) })
  @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX('Slug', 200) })
  slug: string

  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID chương cha') })
  @ToNumber()
  @Min(1)
  parentChapterId?: number

  @IsInt({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Thứ tự') })
  @ToNumber()
  @Min(0)
  orderInParent: number

  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Cấp độ') })
  @ToNumber()
  @Min(0)
  level?: number
}

export class UpdateChapterDto {
  @IsOptional()
  @IsInt()
  @ToNumber()
  @Min(1)
  subjectId?: number

  @Trim()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug?: string

  @IsOptional()
  @IsInt()
  @ToNumber()
  @Min(1)
  parentChapterId?: number

  @IsOptional()
  @IsInt()
  @ToNumber()
  @Min(0)
  orderInParent?: number

  @IsOptional()
  @IsInt()
  @ToNumber()
  @Min(0)
  level?: number
}

export class ChapterResponseDto {
  chapterId: number
  subjectId: number
  name: string
  code?: string | null
  slug: string
  parentChapterId?: number | null
  orderInParent: number
  level: number
  subjectName?: string
  parentName?: string

  static fromChapter(chapter: Chapter): ChapterResponseDto {
    return {
      chapterId: chapter.chapterId,
      subjectId: chapter.subjectId,
      name: chapter.name,
      code: chapter.slug,
      slug: chapter.slug,
      parentChapterId: chapter.parentChapterId,
      orderInParent: chapter.orderInParent,
      level: chapter.level,
      subjectName: chapter.subject?.name,
      parentName: chapter.parent?.name,
    }
  }

  static fromChapterList(chapters: Chapter[]): ChapterResponseDto[] {
    return chapters.map((chapter) => this.fromChapter(chapter))
  }
}

export class ChapterDetailResponseDto extends ChapterResponseDto {
  children?: ChapterResponseDto[]
  fullPath?: string

  static fromChapterWithChildren(chapter: Chapter): ChapterDetailResponseDto {
    return {
      ...ChapterResponseDto.fromChapter(chapter),
      children: chapter.children ? ChapterResponseDto.fromChapterList(chapter.children) : [],
      fullPath: chapter.getFullPath(),
    }
  }
}
