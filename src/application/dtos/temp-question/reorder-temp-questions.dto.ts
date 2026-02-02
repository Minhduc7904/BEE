// src/application/dtos/temp-question/reorder-temp-questions.dto.ts
import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class ReorderItemDto {
    @IsInt()
    @IsNotEmpty()
    id: number

    @IsInt()
    @IsNotEmpty()
    order: number
}

export class ReorderTempQuestionsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderItemDto)
    @IsNotEmpty()
    items: ReorderItemDto[]
}
