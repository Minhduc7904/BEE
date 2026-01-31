// src/application/dtos/exam-import-session/update-exam-import-session-raw-content.dto.ts
import { IsString, IsNotEmpty } from 'class-validator'

export class UpdateExamImportSessionRawContentDto {
  @IsString()
  @IsNotEmpty()
  rawContent: string
}
