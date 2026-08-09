export class BookSalesContactConfigurationEntity {
  bookSalesContactConfigurationId: number
  scopeKey: string
  phone: string
  facebookUrl: string
  createdAt: Date
  updatedAt: Date

  constructor(data: BookSalesContactConfigurationEntity) {
    Object.assign(this, data)
  }
}
