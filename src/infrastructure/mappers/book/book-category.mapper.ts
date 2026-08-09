import { BookCategory } from '@prisma/client'
import { BookCategoryEntity } from 'src/domain/entities'

export class BookCategoryMapper {
  static toDomain(record: BookCategory): BookCategoryEntity {
    return new BookCategoryEntity({
      bookCategoryId: record.bookCategoryId,
      name: record.name,
      slug: record.slug,
      description: record.description,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainList(records: BookCategory[]): BookCategoryEntity[] {
    return records.map((record) => this.toDomain(record))
  }
}
