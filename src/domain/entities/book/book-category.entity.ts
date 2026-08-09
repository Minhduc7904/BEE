export class BookCategoryEntity {
  bookCategoryId: number
  name: string
  slug: string
  description: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date

  constructor(data: BookCategoryEntity) {
    Object.assign(this, data)
  }
}
