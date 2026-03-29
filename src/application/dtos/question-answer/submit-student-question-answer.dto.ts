import {
    IsOptionalInt,
    IsOptionalIntArray,
    IsRequiredIdNumber,
} from '../../../shared/decorators/validate'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'

export class StudentTrueFalseAnswerDto {
    @IsRequiredIdNumber('ID phát biểu')
    statementId: number

    @IsOptional()
    @IsBoolean({ message: 'Lựa chọn đúng/sai phải là true hoặc false' })
    isTrue?: boolean | null
}

export class SubmitStudentQuestionAnswerDto {
    @IsOptionalInt('ID lượt làm bài')
    attemptId?: number

    @IsRequiredIdNumber('ID câu hỏi')
    questionId: number

    @IsOptional()
    @IsString({ message: 'Câu trả lời dạng văn bản phải là chuỗi ký tự' })
    @MaxLength(10000, { message: 'Câu trả lời dạng văn bản không được vượt quá 10000 ký tự' })
    answer?: string

    @IsOptionalIntArray('Danh sách ID các phương án đã chọn')
    selectedStatementIds?: number[]

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StudentTrueFalseAnswerDto)
    trueFalseAnswers?: StudentTrueFalseAnswerDto[]

    @IsOptionalInt('Thời gian làm câu hỏi (giây)', 0, 86400)
    timeSpentSeconds?: number
}
