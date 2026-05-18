import { DocumentTagEntity } from './document-tag.entity'
import { TagType } from 'src/shared/enums'

export class TagEntity {
  tagId: number
  name: string
  slug: string
  type: TagType
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  documents?: DocumentTagEntity[]

  constructor(data: {
    tagId: number
    name: string
    slug: string
    type: TagType
    description: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    documents?: DocumentTagEntity[]
  }) {
    Object.assign(this, data)
  }
}
