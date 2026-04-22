import { IsOptionalInt } from 'src/shared/decorators/validate'

export class PublicStudentRelatedQuestionsQueryDto {
  /**
   * Number of related questions to return
   * @optional
   * @default 10
   * @example 10
   */
  @IsOptionalInt('Số lượng câu hỏi gợi ý', 1, 50)
  limit?: number = 10
}
