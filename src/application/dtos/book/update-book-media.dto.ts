import { IsOptionalIntArrayIncludingEmpty, IsOptionalNullableIdNumber } from 'src/shared/decorators/validate'

export class UpdateBookMediaDto {
  @IsOptionalNullableIdNumber('Media cover')
  coverMediaId?: number | null

  @IsOptionalNullableIdNumber('Media OG image')
  ogImageMediaId?: number | null

  @IsOptionalIntArrayIncludingEmpty('Media gallery')
  galleryMediaIds?: number[]
}
