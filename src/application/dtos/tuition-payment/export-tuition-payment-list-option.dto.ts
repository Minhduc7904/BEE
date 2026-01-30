import { IsBoolean, IsOptional } from 'class-validator'
import { ToBoolean } from 'src/shared/decorators'
import { TuitionPaymentListQueryDto } from './tuition-payment-list-query.dto'

export class ExportTuitionPaymentListOptionDto extends TuitionPaymentListQueryDto {
    /**
     * Include student name field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeStudentName?: boolean = true

    /**
     * Include student phone field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeStudentPhone?: boolean = true

    /**
     * Include parent phone field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeParentPhone?: boolean = true

    /**
     * Include school field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeSchool?: boolean = true

    /**
     * Include grade field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeGrade?: boolean = true

    /**
     * Include amount field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeAmount?: boolean = true

    /**
     * Include month field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeMonth?: boolean = true

    /**
     * Include year field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeYear?: boolean = true

    /**
     * Include status field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeStatus?: boolean = true

    /**
     * Include paid at date field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includePaidAt?: boolean = true

    /**
     * Include notes field
     * @default false
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeNotes?: boolean = false

    /**
     * Include created at timestamp field
     * @default true
     */
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    includeCreatedAt?: boolean = true
}
