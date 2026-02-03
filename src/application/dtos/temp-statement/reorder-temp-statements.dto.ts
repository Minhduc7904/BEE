// src/application/dtos/temp-statement/reorder-temp-statements.dto.ts
import { IsRequiredIdNumber, IsRequiredInt } from 'src/shared/decorators/validate'
import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for reorder item
 * 
 * @description Represents a statement with its new order position
 */
export class ReorderItemDto {
    /**
     * Statement ID
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
 * DTO for reordering temp statements
 * 
 * @description Used to change the order of multiple temp statements at once
 */
export class ReorderTempStatementsDto {
    /**
     * Array of statements with new order positions
     * @required
     * @example [{ id: 1, order: 2 }, { id: 2, order: 1 }]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderItemDto)
    items: ReorderItemDto[]
}
