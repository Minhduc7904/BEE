// src/application/dtos/lessonLearningItem/create-lesson-learning-item.dto.ts
import { IsNotEmpty, IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class CreateLessonLearningItemDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('lessonId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('lessonId') })
    @Type(() => Number)
    lessonId: number

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('learningItemId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('learningItemId') })
    @Type(() => Number)
    learningItemId: number
}
