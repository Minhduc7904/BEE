import { IsOptionalInt, IsOptionalIntArray, IsRequiredIdNumber } from 'src/shared/decorators/validate'

export class StartPublicStudentExamAttemptDto {
    @IsRequiredIdNumber('ID đề thi')
    examId: number

    @IsOptionalIntArray('Danh sách ID câu hỏi')
    questionIds?: number[]

    @IsOptionalInt('Thời gian làm bài (phút)', 1)
    duration?: number
}
