import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalIdNumber, IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'

/**
 * Query DTO for listing student's exam attempts from public exams.
 */
export class StudentExamAttemptListQueryDto extends ListQueryDto {
    @IsOptionalIdNumber('ID học sinh')
    studentId?: number

    @IsOptionalIdNumber('ID đề thi')
    examId?: number

    @IsOptionalEnumValue(ExamAttemptStatus, 'Trạng thái lượt làm bài')
    status?: ExamAttemptStatus

    sortBy?: string = 'startedAt'
}
