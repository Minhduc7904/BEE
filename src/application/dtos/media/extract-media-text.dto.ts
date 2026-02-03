import { IsOptionalBoolean } from 'src/shared/decorators/validate'

/**
 * DTO for media text extraction request
 * 
 * @description Used to extract text from images using OCR
 */
export class ExtractMediaTextDto {
  /**
   * Include image base64 in response (for OCR debugging)
   * @optional
   * @default false
   * @example false
   */
  @IsOptionalBoolean('Bao gồm base64 hình ảnh')
  includeImageBase64?: boolean
}
