import {
  IsOptionalBoolean,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalNumber,
  IsOptionalString,
  IsRequiredInt,
  IsRequiredNumber,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import { AchievementBoardEntity, AchievementRowEntity } from 'src/domain/entities'
import { Visibility } from 'src/shared/enums'

export class CreateAchievementBoardDto {
  @IsOptionalBoolean('Tu dong tao SEO bang AI')
  auto?: boolean

  @IsRequiredString('Tieu de bang thanh tich', 255, 2)
  title: string

  @IsOptionalString('Slug', 255, 2)
  slug?: string

  @IsRequiredString('Ten cuoc thi', 255, 2)
  competitionName: string

  @IsOptionalString('Nam hoc', 50)
  academicYear?: string

  @IsOptionalString('Mo ta')
  description?: string

  @IsOptionalString('Mo ta ngan', 500)
  shortDescription?: string

  @IsOptionalString('Tu khoa chinh', 255)
  targetKeyword?: string

  @IsOptionalString('Danh sach tu khoa')
  keywordText?: string

  @IsOptionalString('Meta title', 255)
  metaTitle?: string

  @IsOptionalString('Meta description', 500)
  metaDescription?: string

  @IsOptionalString('OG title', 255)
  ogTitle?: string

  @IsOptionalString('OG description', 500)
  ogDescription?: string

  @IsOptionalString('Search intent', 100)
  searchIntent?: string

  @IsOptionalInt('Diem SEO', 0, 100)
  seoScore?: number

  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Bang thanh tich noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thu tu sap xep', 0)
  sortOrder?: number
}

export class UpdateAchievementBoardDto {
  @IsOptionalString('Tieu de bang thanh tich', 255, 2)
  title?: string

  @IsOptionalString('Slug', 255, 2)
  slug?: string

  @IsOptionalString('Ten cuoc thi', 255, 2)
  competitionName?: string

  @IsOptionalString('Nam hoc', 50)
  academicYear?: string

  @IsOptionalString('Mo ta')
  description?: string

  @IsOptionalString('Mo ta ngan', 500)
  shortDescription?: string

  @IsOptionalString('Tu khoa chinh', 255)
  targetKeyword?: string

  @IsOptionalString('Danh sach tu khoa')
  keywordText?: string

  @IsOptionalString('Meta title', 255)
  metaTitle?: string

  @IsOptionalString('Meta description', 500)
  metaDescription?: string

  @IsOptionalString('OG title', 255)
  ogTitle?: string

  @IsOptionalString('OG description', 500)
  ogDescription?: string

  @IsOptionalString('Search intent', 100)
  searchIntent?: string

  @IsOptionalInt('Diem SEO', 0, 100)
  seoScore?: number

  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Bang thanh tich noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thu tu sap xep', 0)
  sortOrder?: number
}

export class UpdateAchievementRowDto {
  @IsOptionalString('Ten hoc sinh', 255, 1)
  studentName?: string

  @IsOptionalString('Truong', 255)
  schoolName?: string

  @IsOptionalInt('Khoi', 1, 12)
  grade?: number

  @IsOptionalNumber('Diem', 0)
  score?: number

  @IsOptionalInt('Thu tu sap xep', 0)
  sortOrder?: number
}

export class CreateAchievementRowDto {
  @IsRequiredString('Ten hoc sinh', 255, 1)
  studentName: string

  @IsOptionalString('Truong', 255)
  schoolName?: string

  @IsRequiredInt('Khoi', 1, 12)
  grade: number

  @IsRequiredNumber('Diem', 0)
  score: number
}

export class AchievementRowResponseDto {
  achievementRowId: number
  achievementBoardId: number
  studentName: string
  schoolName: string | null
  grade: number | null
  score: number | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date

  static fromEntity(entity: AchievementRowEntity): AchievementRowResponseDto {
    const dto = new AchievementRowResponseDto()
    Object.assign(dto, entity)
    return dto
  }

  static fromEntityList(entities: AchievementRowEntity[]): AchievementRowResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}

export class AchievementBoardResponseDto {
  achievementBoardId: number
  title: string
  slug: string
  competitionName: string
  academicYear: string | null
  description: string | null
  shortDescription: string | null
  targetKeyword: string | null
  keywordText: string | null
  metaTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  searchIntent: string | null
  seoScore: number | null
  visibility: Visibility
  isFeatured: boolean
  viewCount: number
  sortOrder: number
  createdBy: number | null
  updatedBy: number | null
  createdAt: Date
  updatedAt: Date
  rows: AchievementRowResponseDto[]

  static fromEntity(entity: AchievementBoardEntity): AchievementBoardResponseDto {
    const dto = new AchievementBoardResponseDto()
    Object.assign(dto, entity)
    dto.rows = AchievementRowResponseDto.fromEntityList(entity.rows ?? [])
    return dto
  }

  static fromEntityList(entities: AchievementBoardEntity[]): AchievementBoardResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}

export interface AchievementRowsImportResultDto {
  importedCount: number
  rows: AchievementRowResponseDto[]
}
