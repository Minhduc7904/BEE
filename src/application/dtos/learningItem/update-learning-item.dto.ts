import { Type } from 'class-transformer'
import { LearningItemType } from '../../../shared/enums'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'
import { IsOptionalEnumValue, IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật mục học tập
 * @description Chứa các trường có thể cập nhật của mục học tập
 */
export class UpdateLearningItemDto {
    /**
     * Loại mục học tập
     * @optional
     * @example "VIDEO"
     */
    @IsOptionalEnumValue(LearningItemType, 'type')
    type?: LearningItemType

    /**
     * Tiêu đề (3-200 ký tự)
     * @optional
     * @example "Video bài giảng 1"
     */
    @IsOptionalString('title', 200, 3)
    title?: string

    /**
     * Mô tả (tối đa 1000 ký tự)
     * @optional
     * @example "Nội dung giới thiệu cơ bản"
     */
    @IsOptionalString('description', 1000)
    description?: string

    /**
     * ID cuộc thi
     * @optional
     * @example 5
     */
    @ToNumber()
    @IsOptionalIdNumber('competitionId')
    competitionId?: number
}
