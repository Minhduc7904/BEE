import {
  IsOptionalBoolean,
  IsOptionalEmail,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalString,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import { TeacherProfileEntity } from 'src/domain/entities'
import { Visibility } from 'src/shared/enums'

export class CreateTeacherProfileDto {
  @IsRequiredString('Ten giao vien hien thi', 255, 2)
  displayName: string

  @IsOptionalString('Slug giao vien', 255, 2)
  slug?: string

  @IsOptionalString('Headline', 255)
  headline?: string

  @IsOptionalString('Mo ta ngan', 500)
  shortDescription?: string

  @IsOptionalString('Tieu su')
  bio?: string

  @IsOptionalString('Chuyen mon')
  expertise?: string

  @IsOptionalString('Mon/chu de giang day')
  teachingSubjects?: string

  @IsOptionalString('Khoi/lop giang day', 255)
  gradeLevels?: string

  @IsOptionalString('Hinh thuc day', 255)
  teachingFormats?: string

  @IsOptionalString('Phuong phap day')
  teachingMethods?: string

  @IsOptionalInt('So nam kinh nghiem', 0)
  yearsExperience?: number

  @IsOptionalString('Hoc van')
  education?: string

  @IsOptionalString('Chung chi')
  certifications?: string

  @IsOptionalString('Thanh tich')
  achievements?: string

  @IsOptionalString('Khu vuc day', 255)
  teachingArea?: string

  @IsOptionalString('Noi cong tac', 255)
  workplace?: string

  @IsOptionalEmail('Email lien he', 120)
  contactEmail?: string

  @IsOptionalString('So dien thoai lien he', 20)
  contactPhone?: string

  @IsOptionalString('Zalo lien he', 32)
  contactZalo?: string

  @IsOptionalString('Facebook lien he', 255)
  contactFacebook?: string

  @IsOptionalString('Website lien he', 255)
  contactWebsite?: string

  @IsOptionalString('Dia chi lien he', 500)
  contactAddress?: string

  @IsOptionalString('URL dat lich', 1000)
  bookingUrl?: string

  @IsOptionalString('Nhan CTA', 120)
  ctaLabel?: string

  @IsOptionalString('URL CTA', 1000)
  ctaUrl?: string

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

  @IsOptionalBoolean('Giao vien noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thu tu sap xep', 0)
  sortOrder?: number
}

export class UpdateTeacherProfileDto {
  @IsOptionalString('Ten giao vien hien thi', 255, 2)
  displayName?: string

  @IsOptionalString('Headline', 255)
  headline?: string

  @IsOptionalString('Mo ta ngan', 500)
  shortDescription?: string

  @IsOptionalString('Tieu su')
  bio?: string

  @IsOptionalString('Chuyen mon')
  expertise?: string

  @IsOptionalString('Mon/chu de giang day')
  teachingSubjects?: string

  @IsOptionalString('Khoi/lop giang day', 255)
  gradeLevels?: string

  @IsOptionalString('Hinh thuc day', 255)
  teachingFormats?: string

  @IsOptionalString('Phuong phap day')
  teachingMethods?: string

  @IsOptionalInt('So nam kinh nghiem', 0)
  yearsExperience?: number

  @IsOptionalString('Hoc van')
  education?: string

  @IsOptionalString('Chung chi')
  certifications?: string

  @IsOptionalString('Thanh tich')
  achievements?: string

  @IsOptionalString('Khu vuc day', 255)
  teachingArea?: string

  @IsOptionalString('Noi cong tac', 255)
  workplace?: string

  @IsOptionalEmail('Email lien he', 120)
  contactEmail?: string

  @IsOptionalString('So dien thoai lien he', 20)
  contactPhone?: string

  @IsOptionalString('Zalo lien he', 32)
  contactZalo?: string

  @IsOptionalString('Facebook lien he', 255)
  contactFacebook?: string

  @IsOptionalString('Website lien he', 255)
  contactWebsite?: string

  @IsOptionalString('Dia chi lien he', 500)
  contactAddress?: string

  @IsOptionalString('URL dat lich', 1000)
  bookingUrl?: string

  @IsOptionalString('Nhan CTA', 120)
  ctaLabel?: string

  @IsOptionalString('URL CTA', 1000)
  ctaUrl?: string

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

  @IsOptionalBoolean('Giao vien noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thu tu sap xep', 0)
  sortOrder?: number
}

export class TeacherProfileResponseDto {
  teacherProfileId: number
  displayName: string
  slug: string
  headline: string | null
  shortDescription: string | null
  bio: string | null
  expertise: string | null
  teachingSubjects: string | null
  gradeLevels: string | null
  teachingFormats: string | null
  teachingMethods: string | null
  yearsExperience: number | null
  education: string | null
  certifications: string | null
  achievements: string | null
  teachingArea: string | null
  workplace: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactZalo: string | null
  contactFacebook: string | null
  contactWebsite: string | null
  contactAddress: string | null
  bookingUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
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

  static fromEntity(entity: TeacherProfileEntity): TeacherProfileResponseDto {
    const dto = new TeacherProfileResponseDto()
    Object.assign(dto, entity)
    return dto
  }

  static fromEntityList(entities: TeacherProfileEntity[]): TeacherProfileResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}
