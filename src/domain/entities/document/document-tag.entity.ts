import { DocumentEntity } from './document.entity'
import { TagEntity } from './tag.entity'

export class DocumentTagEntity {
  documentId: number
  tagId: number
  sortOrder: number
  createdAt: Date
  document?: DocumentEntity
  tag?: TagEntity

  constructor(data: {
    documentId: number
    tagId: number
    sortOrder: number
    createdAt: Date
    document?: DocumentEntity
    tag?: TagEntity
  }) {
    Object.assign(this, data)
  }
}
