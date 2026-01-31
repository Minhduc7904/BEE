import { MediaType } from 'src/shared/enums';

/**
 * DTO for media text extraction response
 */
export class MediaTextExtractionResponseDto {
  /**
   * Media ID
   */
  mediaId: number;

  /**
   * Extracted text content
   */
  text: string;

  /**
   * Original filename
   */
  filename: string;

  /**
   * MIME type
   */
  mimeType: string;

  /**
   * Media type (IMAGE, DOCUMENT)
   */
  type: MediaType;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * Number of pages (for PDF) or null for images
   */
  pages?: number | null;

  /**
   * Extracted images with base64 data (only included if includeImageBase64=true)
   */
  imagesBase64?: Array<{
    id: string;
    topLeftX: number;
    topLeftY: number;
    bottomRightX: number;
    bottomRightY: number;
    imageBase64: string;
    imageAnnotation?: string | null;
  }>;

  /**
   * Extraction metadata
   */
  metadata?: {
    model?: string;
    processingTime?: number;
    [key: string]: any;
  };
}
