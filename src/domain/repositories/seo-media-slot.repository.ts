import { SeoMediaSlotEntity } from '../entities'

export interface ISeoMediaSlotRepository {
  create(data: {
    code: string
    name: string
    description?: string | null
    isActive?: boolean
  }): Promise<SeoMediaSlotEntity>

  findById(
    slotId: number,
    options?: {
      includeItems?: boolean
    },
  ): Promise<SeoMediaSlotEntity | null>

  findByCode(
    code: string,
    options?: {
      includeItems?: boolean
    },
  ): Promise<SeoMediaSlotEntity | null>

  findAll(filters?: {
    code?: string
    isActive?: boolean
    includeItems?: boolean
    skip?: number
    take?: number
  }): Promise<SeoMediaSlotEntity[]>

  update(
    slotId: number,
    data: {
      code?: string
      name?: string
      description?: string | null
      isActive?: boolean
    },
  ): Promise<SeoMediaSlotEntity>

  delete(slotId: number): Promise<void>

  count(filters?: {
    code?: string
    isActive?: boolean
  }): Promise<number>
}
