// src/application/dtos/lessonLearningItem/reorder-lesson-learning-items.dto.ts
import { IsRequiredIdNumber, IsRequiredInt } from 'src/shared/decorators/validate'
import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for reorder item
 * 
 * @description Represents a learning item with its new order position in a lesson
 */
export class ReorderLessonLearningItemDto {
    /**
     * Learning Item ID
     * @required
     * @example 123
     */
    @IsRequiredIdNumber('ID mục học')
    learningItemId: number

    /**
     * New order position
     * @required
     * @example 1
     */
    @IsRequiredInt('Thứ tự')
    order: number
}

/**
 * DTO for reordering learning items in a lesson
 * 
 * @description Used to change the order of multiple learning items in a lesson at once
 */
export class ReorderLessonLearningItemsDto {
    /**
     * Lesson ID
     * @required
     * @example 1
     */
    @IsRequiredIdNumber('ID bài học')
    lessonId: number

    /**
     * Array of learning items with new order positions
     * @required
     * @example [{ learningItemId: 1, order: 2 }, { learningItemId: 2, order: 1 }]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderLessonLearningItemDto)
    items: ReorderLessonLearningItemDto[]
}
