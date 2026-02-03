// src/application/dtos/exam-import-session/update-exam-import-session-raw-content.dto.ts
import { IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for updating exam import session raw content
 * 
 * @description Used to update the raw text content of an exam import session
 */
export class UpdateExamImportSessionRawContentDto {
  /**
   * Raw exam content text
   * @required
   * @example 'Updated: Câu 1: What is 2+2? A) 3 B) 4 C) 5 D) 6\nCâu 2: ...'
   */
  @IsRequiredString('Nội dung thô')
  rawContent: string
}
