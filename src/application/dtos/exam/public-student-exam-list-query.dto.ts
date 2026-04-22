import { IsOptionalEnumValue, IsOptionalIdNumber, IsOptionalInt, IsOptionalIntArray } from '../../../shared/decorators/validate'
import { TypeOfExam } from '../../../shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

/**
 * Query DTO for listing public exams for students.
 */
export class PublicStudentExamListQueryDto extends ListQueryDto {
    /**
     * Lọc theo môn học
     * @example 5
     */
    @IsOptionalIdNumber('ID môn học')
    subjectId?: number

    /**
     * Lọc theo khối lớp (1-12)
     * @example 10
     */
    @IsOptionalInt('Khối lớp', 1, 12)
    grade?: number

    /**
     * Lọc theo loại đề
     * @example "GK1"
     */
    @IsOptionalEnumValue(TypeOfExam, 'Loại đề thi')
    typeOfExam?: TypeOfExam

    /**
     * Lọc theo danh sách chapterId của câu hỏi trong đề
     * Chỉ cần đề có ít nhất 1 câu hỏi thuộc 1 chapter trong danh sách
     * @example [5, 6]
     */
    @IsOptionalIntArray('Danh sách ID chương')
    chapterIds?: number[]

    sortBy?: string = 'createdAt'
}
