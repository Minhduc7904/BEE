import { IsOptionalIntArray } from 'src/shared/decorators/validate'

export class PublicStudentExamContentQueryDto {
    @IsOptionalIntArray('Danh sách ID câu hỏi')
    questionIds?: number[]
}
