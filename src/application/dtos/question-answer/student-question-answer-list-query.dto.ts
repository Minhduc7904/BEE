import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * Query DTO for listing student's question answers from public exams.
 *
 * Inherits pagination/sort/search fields from ListQueryDto:
 * - page (default: 1)
 * - limit (default: 10)
 * - sortBy
 * - sortOrder
 */
export class StudentQuestionAnswerListQueryDto extends ListQueryDto {
    @IsOptionalIdNumber('ID học sinh')
    studentId?: number

    /**
     * Optional filter by exam ID (public exam only).
     * @example 10
     */
    @IsOptionalIdNumber('ID đề thi')
    examId?: number

    /**
     * Optional filter by attempt ID.
     * @example 120
     */
    @IsOptionalIdNumber('ID lượt làm bài')
    attemptId?: number

    /**
     * Optional filter by question ID.
     * @example 345
     */
    @IsOptionalIdNumber('ID câu hỏi')
    questionId?: number

    sortBy?: string = 'questionAnswerId'
}
