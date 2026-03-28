import { IsOptionalEnumValue, IsOptionalIdNumber, IsOptionalInt } from '../../../shared/decorators/validate'
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

    sortBy?: string = 'createdAt'
}
