import { SeoMediaSlotEntity } from '../entities'

export interface ISeoMediaSlotRepository {
  create(data: {
    code: string
    name: string
    pageKey?: string | null
    type?: string
    description?: string | null
    isActive?: boolean
    minItems?: number
    maxItems?: number | null
    recommendedWidth?: number | null
    recommendedHeight?: number | null
    metadata?: unknown | null
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
    pageKey?: string
    type?: string
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
      pageKey?: string | null
      type?: string
      description?: string | null
      isActive?: boolean
      minItems?: number
      maxItems?: number | null
      recommendedWidth?: number | null
      recommendedHeight?: number | null
      metadata?: unknown | null
    },
  ): Promise<SeoMediaSlotEntity>

  delete(slotId: number): Promise<void>

  count(filters?: {
    code?: string
    pageKey?: string
    type?: string
    isActive?: boolean
  }): Promise<number>
}
