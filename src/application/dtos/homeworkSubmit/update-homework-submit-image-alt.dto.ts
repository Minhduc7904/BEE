import { IsRequiredString } from 'src/shared/decorators/validate'

export class UpdateHomeworkSubmitImageAltDto {
  @IsRequiredString('Nhận xét file', 255)
  alt: string
}
