import { IsOptionalBoolean } from 'src/shared/decorators/validate'
import { StudentListQueryDto } from './student-list-query.dto'

/**
 * DTO for customizing student list export fields
 * 
 * @description Used to configure which columns to include in student export
 */
export class ExportStudentListOptionDto extends StudentListQueryDto {
    /**
     * Include school field
     * @optional
     * @default true
     * @example true
     */
    @IsOptionalBoolean('Bao gồm trường')
    includeSchool?: boolean = true

    /**
     * Include gender field
     * @optional
     * @default true
     * @example true
     */
    @IsOptionalBoolean('Bao gồm giới tính')
    includeGender?: boolean = true

    /**
     * Include date of birth field
     * @optional
     * @default true
     * @example true
     */
    @IsOptionalBoolean('Bao gồm ngày sinh')
    includeDateOfBirth?: boolean = true

    /**
     * Include username field
     * @optional
     * @default true
     * @example true
     */
    @IsOptionalBoolean('Bao gồm tên đăng nhập')
    includeUsername?: boolean = true

    /**
     * Include parent phone field
     * @optional
     * @default true
     * @example true
     */
    @IsOptionalBoolean('Bao gồm số điện thoại phụ huynh')
    includeParentPhone?: boolean = true

    /**
     * Include student phone field
     * @default false
     */
    @IsOptionalBoolean('Bao gồm số điện thoại học sinh')
    includeStudentPhone?: boolean = false

    /**
     * Include grade field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm khối')
    includeGrade?: boolean = true

    /**
     * Include email field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm email')
    includeEmail?: boolean = true

    /**
     * Include isActive field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm trạng thái hoạt động')
    includeIsActive?: boolean = true

    /**
     * Include createdAt timestamp field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm ngày tạo')
    includeCreatedAt?: boolean = true

    /**
     * Include class field
     * @default false
     */
    @IsOptionalBoolean('Bao gồm lớp')
    includeClasses?: boolean = false
}

export interface AttendanceExportColumn {
    header: string
    key: string
    width: number
    enabled: boolean
}