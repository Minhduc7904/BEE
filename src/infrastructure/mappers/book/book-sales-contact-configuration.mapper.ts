import { BookSalesContactConfiguration } from '@prisma/client'
import { BookSalesContactConfigurationEntity } from 'src/domain/entities'

export class BookSalesContactConfigurationMapper {
  static toDomain(record: BookSalesContactConfiguration): BookSalesContactConfigurationEntity {
    return new BookSalesContactConfigurationEntity({
      bookSalesContactConfigurationId: record.bookSalesContactConfigurationId,
      scopeKey: record.scopeKey,
      phone: record.phone,
      facebookUrl: record.facebookUrl,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
