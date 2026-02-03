// src/application/dtos/temp-section/reorder-temp-sections.dto.ts
import { IsRequiredIdNumber, IsRequiredInt } from 'src/shared/decorators/validate'
import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for reorder section item
 * 
 * @description Represents a section with its new order position
 */
export class ReorderSectionItemDto {
    /**
     * Section ID
     * @required
     * @example 123
     */
    @IsRequiredIdNumber('ID')
    id: number

    /**
     * New order position
     * @required
     * @example 1
     */
    @IsRequiredInt('Thứ tự')
    order: number
}

/**
 * DTO for reordering temp sections
 * 
 * @description Used to change the order of multiple temp sections at once
 */
export class ReorderTempSectionsDto {
    /**
     * Array of sections with new order positions
     * @required
     * @example [{ id: 1, order: 2 }, { id: 2, order: 1 }]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderSectionItemDto)
    items: ReorderSectionItemDto[]
}
