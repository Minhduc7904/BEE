import { IsRequiredInt } from 'src/shared/decorators/validate'

export class PromoteStudentGradeByGraduationYearDto {
    /**
     * Năm tốt nghiệp cấp 3
     * @required
     * @example 2026
     */
    @IsRequiredInt('Năm tốt nghiệp cấp 3', 1900, 2100)
    highSchoolGraduationYear: number
}
