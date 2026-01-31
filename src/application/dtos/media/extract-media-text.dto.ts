import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for media text extraction request
 */
export class ExtractMediaTextDto {
  /**
   * Whether to include image base64 in response (for OCR debugging)
   * @example false
   */
  @IsOptional()
  includeImageBase64?: boolean;
}
