import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ToNumber } from 'src/shared/decorators'
import { IsRequiredIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO tạo liên kết bài học - mục học tập
 * @description Chứa thông tin để liên kết mục học tập với bài học
 */
export class CreateLessonLearningItemDto {
    /**
     * ID bài học
     * @required
     * @example 10
     */
    @ToNumber()
    @IsRequiredIdNumber('lessonId')
    lessonId: number

    /**
     * ID mục học tập
     * @required
     * @example 15
     */
    @ToNumber()
    @IsRequiredIdNumber('learningItemId')
    learningItemId: number
}
