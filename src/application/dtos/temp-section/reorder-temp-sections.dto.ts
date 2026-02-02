// src/application/dtos/temp-section/reorder-temp-sections.dto.ts
import { IsArray, IsString, IsInt, IsNotEmpty, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class ReorderSectionItemDto {
    @IsInt()
    @IsNotEmpty()
    id: number

    @IsInt()
    @IsNotEmpty()
    order: number
}

export class ReorderTempSectionsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderSectionItemDto)
    @IsNotEmpty()
    items: ReorderSectionItemDto[]
}
