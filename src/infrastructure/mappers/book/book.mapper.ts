import { Book, Prisma } from '@prisma/client'
import { BookEntity, BookStructuredData } from 'src/domain/entities'
import { Visibility } from 'src/shared/enums'
import { BookCategoryMapper } from './book-category.mapper'

type BookWithCategories = Prisma.BookGetPayload<{
  include: { categoryLinks: { include: { category: true } } }
}>

export class BookMapper {
  static toDomain(record: Book | BookWithCategories): BookEntity {
    const categoryLinks = 'categoryLinks' in record ? record.categoryLinks : undefined
    return new BookEntity({
      bookId: record.bookId,
      sku: record.sku,
      isbn: record.isbn,
      title: record.title,
      slug: record.slug,
      shortDescription: record.shortDescription,
      content: record.content,
      author: record.author,
      publisher: record.publisher,
      priceVnd: record.priceVnd,
      visibility: record.visibility as Visibility,
      isFeatured: record.isFeatured,
      viewCount: record.viewCount,
      targetKeyword: record.targetKeyword,
      keywordText: record.keywordText,
      metaTitle: record.metaTitle,
      metaDescription: record.metaDescription,
      ogTitle: record.ogTitle,
      ogDescription: record.ogDescription,
      canonicalUrl: record.canonicalUrl,
      searchIntent: record.searchIntent,
      seoScore: record.seoScore,
      structuredData: record.structuredData as BookStructuredData,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      categories: categoryLinks?.map((link) => BookCategoryMapper.toDomain(link.category)),
    })
  }

  static toDomainList(records: Array<Book | BookWithCategories>): BookEntity[] {
    return records.map((record) => this.toDomain(record))
  }
}
