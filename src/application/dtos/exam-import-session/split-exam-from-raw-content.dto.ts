import { IsString, IsNotEmpty } from 'class-validator'

/**
 * DTO cho request tách câu hỏi từ rawContent
 */
export class SplitExamFromRawContentDto {
  @IsString()
  @IsNotEmpty()
  rawContent: string
}
