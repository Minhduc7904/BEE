import { IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for splitting exam questions from raw content
 * 
 * @description Used to parse raw text content and extract individual questions
 */
export class SplitExamFromRawContentDto {
  /**
   * Raw exam content text
   * @required
   * @example 'Câu 1: What is 2+2? A) 3 B) 4 C) 5 D) 6\nCâu 2: ...'
   */
  @IsRequiredString('Nội dung thô')
  rawContent: string
}
