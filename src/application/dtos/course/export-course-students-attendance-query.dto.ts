import { IsBoolean, IsOptional } from 'class-validator'
import { CourseStudentsAttendanceQueryDto } from './course-students-attendance-query.dto'
import { ToBoolean } from 'src/shared/decorators'

/**
 * Combined DTO for exporting course students attendance
 * Extends the query DTO and adds export options
 */
export class ExportCourseStudentsAttendanceQueryDto extends CourseStudentsAttendanceQueryDto {
    /**
     * Include school field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeSchool?: boolean = true

    /**
     * Include parent phone field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeParentPhone?: boolean = true

    /**
     * Include student phone field
     * @default false
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeStudentPhone?: boolean = false

    /**
     * Include grade field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeGrade?: boolean = true

    /**
     * Include email field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeEmail?: boolean = true

    /**
     * Convert to export options
     */
    toExportOptions(): {
        includeSchool: boolean
        includeParentPhone: boolean
        includeStudentPhone: boolean
        includeGrade: boolean
        includeEmail: boolean
    } {
        return {
            includeSchool: this.includeSchool ?? true,
            includeParentPhone: this.includeParentPhone ?? true,
            includeStudentPhone: this.includeStudentPhone ?? false,
            includeGrade: this.includeGrade ?? true,
            includeEmail: this.includeEmail ?? true,
        }
    }
}
