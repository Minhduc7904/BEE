import { IsBoolean, IsOptional, IsEnum } from 'class-validator'
import { ToBoolean } from 'src/shared/decorators'
import { StudentListQueryDto } from './student-list-query.dto'

export class ExportStudentListOptionDto extends StudentListQueryDto {
    /**
     * Include school field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeSchool?: boolean = true

    /**
     * Include gender field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeGender?: boolean = true

    /**
     * Include date of birth field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeDateOfBirth?: boolean = true

    /**
     * Include username field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeUsername?: boolean = true

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
     * Include isActive field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeIsActive?: boolean = true

    /**
     * Include createdAt timestamp field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeCreatedAt?: boolean = true

    /**
     * Include class field
     * @default false
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeClasses?: boolean = false
}

export interface AttendanceExportColumn {
    header: string
    key: string
    width: number
    enabled: boolean
}