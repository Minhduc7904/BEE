import { BookSalesContactConfigurationEntity } from '../entities'

export interface IBookSalesContactConfigurationRepository {
  findCurrent(): Promise<BookSalesContactConfigurationEntity | null>
  upsertCurrent(data: { phone: string; facebookUrl: string }): Promise<BookSalesContactConfigurationEntity>
}
