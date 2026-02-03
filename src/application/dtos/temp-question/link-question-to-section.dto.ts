// src/application/dtos/temp-question/link-question-to-section.dto.ts
import { IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for linking question to section
 * 
 * @description Used to assign or unassign a question to/from a section
 */
export class LinkQuestionToSectionDto {
  /**
   * Section ID (null to unlink)
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID phần')
  tempSectionId?: number | null
}
