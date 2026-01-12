import { IsBoolean, IsOptional, IsEnum } from 'class-validator'
import { Transform } from 'class-transformer'

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
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeSchool?: boolean = true

    /**
     * Include parent phone field
     * @default true
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeParentPhone?: boolean = true

    /**
     * Include student phone field
     * @default false
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeStudentPhone?: boolean = false

    /**
     * Include grade field
     * @default true
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeGrade?: boolean = true

    /**
     * Include email field
     * @default true
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeEmail?: boolean = true

    /**
     * Include marked at timestamp field
     * @default true
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeMarkedAt?: boolean = true

    /**
     * Include notes field
     * @default true
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeNotes?: boolean = true

    /**
     * Include makeup note field
     * @default false
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    includeMakeupNote?: boolean = false

    /**
     * Include marker name field
     * @default true
     */
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
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
