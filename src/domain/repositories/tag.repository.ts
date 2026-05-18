import { TagEntity } from '../entities'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { TagType } from 'src/shared/enums'

export interface CreateTagData {
  name: string
  slug: string
  type?: TagType
  description?: string | null
  isActive?: boolean
}

export interface UpdateTagData extends Partial<CreateTagData> {}

export interface TagListOptions {
  skip: number
  take: number
  sortBy: string
  sortOrder: SortOrder
  search?: string
  type?: TagType
  isActive?: boolean
  includeDocuments?: boolean
}

export interface ITagRepository {
  create(data: CreateTagData): Promise<TagEntity>
  upsertByName(data: CreateTagData): Promise<TagEntity>
  findById(tagId: number, includeDocuments?: boolean): Promise<TagEntity | null>
  findBySlug(slug: string, includeDocuments?: boolean): Promise<TagEntity | null>
  findByName(name: string): Promise<TagEntity | null>
  findManyByIds(tagIds: number[]): Promise<TagEntity[]>
  findAllWithPagination(options: TagListOptions): Promise<{ data: TagEntity[]; total: number }>
  update(tagId: number, data: UpdateTagData): Promise<TagEntity>
  delete(tagId: number): Promise<void>
}
