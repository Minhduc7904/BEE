import { IsRequiredInt } from 'src/shared/decorators/validate'

export class UpdateStudentGraduationYearByGradeDto {
    /**
     * Khối lớp cần cập nhật
     * @required
     * @example 12
     */
    @IsRequiredInt('Khối lớp', 1, 12)
    grade: number

    /**
     * Năm tốt nghiệp cấp 3
     * @required
     * @example 2026
     */
    @IsRequiredInt('Năm tốt nghiệp cấp 3', 1900, 2100)
    highSchoolGraduationYear: number
}
