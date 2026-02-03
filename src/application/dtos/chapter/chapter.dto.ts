import { Chapter } from '../../../domain/entities/chapter/chapter.entity'
import { 
  IsRequiredIdNumber, 
  IsRequiredString, 
  IsOptionalString, 
  IsOptionalIdNumber,
  IsRequiredInt,
  IsOptionalInt
} from 'src/shared/decorators/validate'
import { MinLength } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

/**
 * DTO for creating a new chapter
 * 
 * Required fields:
 * - Subject ID (ID môn học)
 * - Name (Tên chương)
 * - Slug (Đường dẫn thân thiện)
 * - Order in Parent (Thứ tự)
 * 
 * Optional fields:
 * - Code (Mã chương)
 * - Parent Chapter ID (ID chương cha)
 * - Level (Cấp độ)
 */
export class CreateChapterDto {
  // Subject and hierarchy
  /**
   * Subject ID that this chapter belongs to
   * @required
   */
  @IsRequiredIdNumber('ID môn học')
  subjectId: number

  /**
   * Parent chapter ID for nested structure
   * @optional
   */
  @IsOptionalIdNumber('ID chương cha')
  parentChapterId?: number

  // Chapter information
  /**
   * Chapter name
   * @required
   * @minLength 2
   * @maxLength 200
   */
  @IsRequiredString('Tên chương', 200)
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Tên chương', 2) })
  name: string

  /**
   * Chapter code (optional identifier)
   * @optional
   * @maxLength 50
   */
  @IsOptionalString('Mã chương', 50)
  code?: string

  /**
   * URL-friendly slug
   * @required
   * @minLength 2
   * @maxLength 200
   */
  @IsRequiredString('Slug', 200)
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Slug', 2) })
  slug: string

  // Ordering and level
  /**
   * Order position within parent chapter
   * @required
   * @min 0
   */
  @IsRequiredInt('Thứ tự', 0)
  orderInParent: number

  /**
   * Hierarchical level (0 = root)
   * @optional
   * @min 0
   */
  @IsOptionalInt('Cấp độ', 0)
  level?: number
}

/**
 * DTO for updating an existing chapter
 * All fields are optional - only provided fields will be updated
 */
export class UpdateChapterDto {
  // Subject and hierarchy
  /**
   * Subject ID that this chapter belongs to
   * @optional
   */
  @IsOptionalIdNumber('ID môn học')
  subjectId?: number

  /**
   * Parent chapter ID for nested structure
   * @optional
   */
  @IsOptionalIdNumber('ID chương cha')
  parentChapterId?: number

  // Chapter information
  /**
   * Chapter name
   * @optional
   * @minLength 2
   * @maxLength 200
   */
  @IsOptionalString('Tên chương', 200)
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Tên chương', 2) })
  name?: string

  /**
   * Chapter code (optional identifier)
   * @optional
   * @maxLength 50
   */
  @IsOptionalString('Mã chương', 50)
  code?: string

  /**
   * URL-friendly slug
   * @optional
   * @minLength 2
   * @maxLength 200
   */
  @IsOptionalString('Slug', 200)
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Slug', 2) })
  slug?: string

  // Ordering and level
  /**
   * Order position within parent chapter
   * @optional
   * @min 0
   */
  @IsOptionalInt('Thứ tự', 0)
  orderInParent?: number

  /**
   * Hierarchical level (0 = root)
   * @optional
   * @min 0
   */
  @IsOptionalInt('Cấp độ', 0)
  level?: number
}

/**
 * Response DTO for chapter data
 */
export class ChapterResponseDto {
  /**
   * Chapter unique identifier
   */
  chapterId: number

  /**
   * Subject ID that this chapter belongs to
   */
  subjectId: number

  /**
   * Chapter name
   */
  name: string

  /**
   * Chapter code (optional)
   */
  code?: string | null

  /**
   * URL-friendly slug
   */
  slug: string

  /**
   * Parent chapter ID (null for root chapters)
   */
  parentChapterId?: number | null

  /**
   * Order position within parent
   */
  orderInParent: number

  /**
   * Hierarchical level
   */
  level: number

  /**
   * Subject name (populated from relation)
   */
  subjectName?: string

  /**
   * Parent chapter name (populated from relation)
   */
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

/**
 * Detailed response DTO for chapter with children and full path
 */
export class ChapterDetailResponseDto extends ChapterResponseDto {
  /**
   * Child chapters (nested structure)
   */
  children?: ChapterResponseDto[]

  /**
   * Full hierarchical path (e.g., "Math > Algebra > Linear Equations")
   */
  fullPath?: string

  static fromChapterWithChildren(chapter: Chapter): ChapterDetailResponseDto {
    return {
      ...ChapterResponseDto.fromChapter(chapter),
      children: chapter.children ? ChapterResponseDto.fromChapterList(chapter.children) : [],
      fullPath: chapter.getFullPath(),
    }
  }
}
