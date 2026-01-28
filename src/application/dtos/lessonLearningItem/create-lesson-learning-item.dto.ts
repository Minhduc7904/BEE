// src/application/dtos/lessonLearningItem/create-lesson-learning-item.dto.ts
import { IsNotEmpty, IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ToNumber } from 'src/shared/decorators'

export class CreateLessonLearningItemDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('lessonId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('lessonId') })
    @ToNumber()
    lessonId: number

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('learningItemId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('learningItemId') })
    @ToNumber()
    learningItemId: number
}
