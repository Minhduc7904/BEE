import { IsOptionalBoolean } from 'src/shared/decorators/validate'

/**
 * DTO for customizing course students attendance export fields
 * 
 * @description Used to configure which columns to include in course attendance export
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
     * @optional
     * @default true
     * @example true
     */
    @IsOptionalBoolean('Bao gồm trường')
    includeSchool?: boolean = true

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
     * @optional
     * @default false
     * @example false
     */
    @IsOptionalBoolean('Bao gồm số điện thoại học sinh')
    includeStudentPhone?: boolean = false

    /**
     * Include grade field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm lớp')
    includeGrade?: boolean = true

    /**
     * Include email field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm email')
    includeEmail?: boolean = true
}
