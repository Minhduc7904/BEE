import { Type } from 'class-transformer'
import { LearningItemType } from '../../../shared/enums'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from '../../../shared/decorators'
import { IsRequiredEnumValue, IsRequiredString, IsOptionalString, IsOptionalIdNumber, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO tạo mục học tập
 * @description Chứa thông tin đệ tạo mục học tập (video, document, homework, exam)
 */
export class CreateLearningItemDto {
    /**
     * Loại mục học tập
     * @required
     * @example "VIDEO"
     */
    @IsRequiredEnumValue(LearningItemType, 'type')
    type: LearningItemType

    /**
     * Tiêu đề (3-200 ký tự)
     * @required
     * @example "Video bài giảng 1"
     */
    @IsRequiredString('title', 200, 3)
    title: string

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

    /**
     * ID bài học
     * @optional
     * @example 10
     */
    @ToNumber()
    @IsOptionalIdNumber('lessonId')
    lessonId?: number

    /**
     * Thứ tự hiển thị
     * @optional
     * @example 1
     */
    @ToNumber()
    @IsOptionalInt('order')
    order?: number
}
