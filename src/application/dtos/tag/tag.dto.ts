import {
  IsOptionalBoolean,
  IsOptionalEnumValue,
  IsOptionalString,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import { TagEntity } from 'src/domain/entities'
import { TagType } from 'src/shared/enums'

export class CreateTagDto {
  @IsRequiredString('Ten tag', 120, 2)
  name: string

  @IsOptionalString('Slug tag', 160, 2)
  slug?: string

  @IsOptionalEnumValue(TagType, 'Loai tag')
  type?: TagType

  @IsOptionalString('Mo ta tag', 500)
  description?: string

  @IsOptionalBoolean('Trang thai kich hoat')
  isActive?: boolean
}

export class UpdateTagDto {
  @IsOptionalString('Ten tag', 120, 2)
  name?: string

  @IsOptionalString('Slug tag', 160, 2)
  slug?: string

  @IsOptionalEnumValue(TagType, 'Loai tag')
  type?: TagType

  @IsOptionalString('Mo ta tag', 500)
  description?: string

  @IsOptionalBoolean('Trang thai kich hoat')
  isActive?: boolean
}

export class TagResponseDto {
  tagId: number
  name: string
  slug: string
  type: TagType
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  static fromEntity(entity: TagEntity): TagResponseDto {
    const dto = new TagResponseDto()
    dto.tagId = entity.tagId
    dto.name = entity.name
    dto.slug = entity.slug
    dto.type = entity.type
    dto.description = entity.description
    dto.isActive = entity.isActive
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }

  static fromEntityList(entities: TagEntity[]): TagResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}
