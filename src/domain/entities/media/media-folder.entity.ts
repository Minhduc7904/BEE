/**
 * MediaFolderEntity - Domain entity for media folder management
 * 
 * Represents a hierarchical folder structure for organizing media files.
 * Supports parent-child relationships for nested folder organization.
 */
export class MediaFolderEntity {
  folderId: number
  name: string
  slug: string
  description: string | null
  parentId: number | null
  createdBy: number | null
  mediaCount?: number
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    folderId: number
    name: string
    slug: string
    description: string | null
    parentId: number | null
    createdBy: number | null
    mediaCount?: number
    createdAt: Date
    updatedAt: Date
  }) {
    Object.assign(this, data)
  }

  isRoot(): boolean {
    return this.parentId === null
  }

  hasParent(): boolean {
    return this.parentId !== null
  }
}
