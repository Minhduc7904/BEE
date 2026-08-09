import { BookCategoryEntity } from '../entities'

export interface CreateBookCategoryData {
  name: string
  slug: string
  description?: string | null
  isActive?: boolean
  sortOrder?: number
}

export interface IBookCategoryRepository {
  create(data: CreateBookCategoryData): Promise<BookCategoryEntity>
  findById(bookCategoryId: number): Promise<BookCategoryEntity | null>
  findBySlug(slug: string): Promise<BookCategoryEntity | null>
  findAll(options?: { isActive?: boolean }): Promise<BookCategoryEntity[]>
  update(bookCategoryId: number, data: Partial<CreateBookCategoryData>): Promise<BookCategoryEntity>
  countBooks(bookCategoryId: number): Promise<number>
  delete(bookCategoryId: number): Promise<void>
}
