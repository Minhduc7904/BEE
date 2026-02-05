// src/application/dtos/section/section.dto.ts
import { Section } from '../../../domain/entities/exam/section.entity'
import { PaginationResponseDto, PaginationMetaDto } from '../pagination/pagination-response.dto'

/**
 * DTO for section response
 * 
 * @description Represents a section with all its details
 */
export class SectionResponseDto {
  sectionId: number
  examId: number
  title: string
  description?: string | null
  order: number
  createdAt: Date
  updatedAt: Date

  static fromEntity(entity: Section): SectionResponseDto {
    const dto = new SectionResponseDto()
    dto.sectionId = entity.sectionId
    dto.examId = entity.examId
    dto.title = entity.title
    dto.description = entity.description
    dto.order = entity.order
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }

  static fromEntities(entities: Section[]): SectionResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}

/**
 * DTO for section list response
 * 
 * @description Paginated list of sections
 */
export class SectionListResponseDto extends PaginationResponseDto<SectionResponseDto> {
  sections: SectionResponseDto[]

  constructor(sections: SectionResponseDto[], total: number, page: number, limit: number) {
    const meta = new PaginationMetaDto(page, limit, total)
    super(true, 'Lấy danh sách section thành công', sections, meta)
    this.sections = sections
  }
}
