import { BookCategoryEntity } from 'src/domain/entities'
import { IsOptionalBoolean, IsOptionalInt, IsOptionalString, IsRequiredString } from 'src/shared/decorators/validate'

export class CreateBookCategoryDto {
  @IsRequiredString('Tên loại sách', 150, 2)
  name: string

  @IsOptionalString('Slug', 180, 2)
  slug?: string

  @IsOptionalString('Mô tả')
  description?: string | null

  @IsOptionalBoolean('Trạng thái hoạt động')
  isActive?: boolean

  @IsOptionalInt('Thứ tự hiển thị', 0)
  sortOrder?: number
}

export class UpdateBookCategoryDto {
  @IsOptionalString('Tên loại sách', 150, 2)
  name?: string

  @IsOptionalString('Slug', 180, 2)
  slug?: string

  @IsOptionalString('Mô tả')
  description?: string | null

  @IsOptionalBoolean('Trạng thái hoạt động')
  isActive?: boolean

  @IsOptionalInt('Thứ tự hiển thị', 0)
  sortOrder?: number
}

export class BookCategoryDto {
  bookCategoryId: number
  name: string
  slug: string
  description: string | null
  isActive: boolean
  sortOrder: number

  static fromEntity(entity: BookCategoryEntity): BookCategoryDto {
    return Object.assign(new BookCategoryDto(), entity)
  }

  static fromEntityList(entities: BookCategoryEntity[]): BookCategoryDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}
