// src/application/dtos/competition/competition-list-query.dto.ts
import { IsOptionalIdNumber, IsOptionalEnumValue, IsOptionalDate } from '../../../shared/decorators/validate'
import { Visibility } from '../../../shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

export class CompetitionListQueryDto extends ListQueryDto {
    /**
     * Lọc theo đề thi
     * @example 5
     */
    @IsOptionalIdNumber('ID đề thi')
    examId?: number

    /**
     * Lọc theo trạng thái hiển thị
     * @example "PUBLISHED"
     */
    @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
    visibility?: Visibility

    /**
     * Lọc theo người tạo
     * @example 1
     */
    @IsOptionalIdNumber('ID người tạo')
    createdBy?: number

    /**
     * Lọc cuộc thi đang diễn ra (theo thời gian hiện tại)
     * @example true
     */
    @IsOptionalDate('Ngày bắt đầu')
    startDateFrom?: Date

    /**
     * Lọc theo ngày kết thúc
     * @example "2024-12-31T23:59:59Z"
     */
    @IsOptionalDate('Ngày kết thúc')
    endDateTo?: Date
}
