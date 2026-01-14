import { IsBoolean, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'
import { ToBoolean } from 'src/shared/decorators'
/**
 * DTO for customizing course students attendance export fields
 * 
 * Default fields (always included):
 * - STT (序号)
 * - Mã học sinh (Student Code)
 * - Họ (Last Name)
 * - Tên (First Name)
 * - Tổng số buổi (Total Sessions)
 * - Có mặt (Present Count)
 * - Vắng (Absent Count)
 * - Muộn (Late Count)
 * - Học bù (Makeup Count)
 * 
 * Optional fields (can be toggled):
 * - Trường (School)
 * - SĐT phụ huynh (Parent Phone)
 * - SĐT học sinh (Student Phone)
 * - Lớp (Grade)
 * - Email
 */
export class ExportCourseStudentsAttendanceOptionsDto {
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
}
