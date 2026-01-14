// src/application/dtos/attendance/export-attendance-image-options.dto.ts
import { IsEnum, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'
import { ToBoolean } from 'src/shared/decorators'
/**
 * DTO for exporting attendance image options
 */
export class ExportAttendanceImageOptionsDto {
    /** Display mode (default: 'download') */
    @IsOptional()
    @IsEnum(['download', 'view'])
    mode?: 'download' | 'view' = 'download'

    /** Image format (default: 'png') */
    @IsOptional()
    @IsEnum(['png', 'jpeg', 'webp'])
    format?: 'png' | 'jpeg' | 'webp' = 'png'

    /** Image quality 0-100 (for jpeg/webp, default: 90) */
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    quality?: number = 90

    /** Viewport width (default: 1200) */
    @IsOptional()
    @IsInt()
    @Min(320)
    @Max(3840)
    @Type(() => Number)
    width?: number = 1200

    /** Include student photo (default: true) */
    @IsOptional()
    @ToBoolean()
    @ToBoolean()
    @IsBoolean()
    includePhoto?: boolean = true

    /** Include parent phone (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeParentPhone?: boolean = true

    /** Include student phone (default: false) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeStudentPhone?: boolean = false

    /** Include email (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeEmail?: boolean = true

    /** Include notes (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeNotes?: boolean = true

    /** Include QR code (default: false) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeQRCode?: boolean = false

    /** Include teacher name (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeTeacherName?: boolean = true

    /** Include marker name (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeMarkerName?: boolean = true

    /** Include session start time (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeStartTime?: boolean = true

    /** Include session end time (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeEndTime?: boolean = true

    /** Include student ID (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeStudentId?: boolean = true

    /** Include class name (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeClassName?: boolean = true

    /** Include course name (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeCourseName?: boolean = true

    /** Include marked at time (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeMarkedAt?: boolean = true

    /** Include grade and school (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeGradeSchool?: boolean = true

    /** Include tuition section (default: true) */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeTuition?: boolean = true
}
