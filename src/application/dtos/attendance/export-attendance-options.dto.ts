import { IsOptionalBoolean, IsOptionalEnumValue } from 'src/shared/decorators/validate'
/**
 * DTO for customizing attendance export fields
 * 
 * Default fields (always included):
 * - STT (序号)
 * - Mã học sinh (Student Code)
 * - Họ (Last Name)
 * - Tên (First Name)
 * - Trạng thái (Status)
 * 
 * Optional fields (can be toggled):
 * - Trường (School)
 * - SĐT phụ huynh (Parent Phone)
 * - SĐT học sinh (Student Phone)
 * - Lớp (Grade)
 * - Email
 * - Thời gian điểm danh (Marked At)
 * - Ghi chú (Notes)
 * - Ghi chú điểm danh bù (Makeup Note)
 * - Người điểm danh (Marker Name)
 */
export class ExportAttendanceOptionsDto {
    /**
     * Include school field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm trường')
    includeSchool?: boolean = true

    /**
     * Include parent phone field
     * @default true
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
     * Include marked at timestamp field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm thời gian điểm danh')
    includeMarkedAt?: boolean = true

    /**
     * Include notes field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm ghi chú')
    includeNotes?: boolean = true

    /**
     * Include makeup note field
     * @default false
     */
    @IsOptionalBoolean('Bao gồm ghi chú điểm danh bù')
    includeMakeupNote?: boolean = false

    /**
     * Include marker name field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm tên người điểm danh')
    includeMarkerName?: boolean = true
}

/**
 * Interface for column configuration
 */
export interface AttendanceExportColumn {
    header: string
    key: string
    width: number
    enabled: boolean
}
