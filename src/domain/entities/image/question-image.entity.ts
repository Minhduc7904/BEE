import { StorageProvider } from '../../../shared/enums'
import { Admin } from '..'

export class QuestionImage {
  imageId: number
  adminId?: number
  admin?: Admin
  url: string
  anotherUrl?: string
  caption?: string
  mimeType?: string
  storageProvider: StorageProvider
  relatedType?: string
  relatedId?: number
  createdAt: Date
  updatedAt: Date

  constructor(
    imageId: number,
    url: string,
    adminId?: number,
    admin?: Admin,
    anotherUrl?: string,
    caption?: string,
    mimeType?: string,
    storageProvider: StorageProvider = StorageProvider.EXTERNAL,
    relatedType?: string,
    relatedId?: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.imageId = imageId
    this.adminId = adminId
    this.admin = admin
    this.url = url
    this.anotherUrl = anotherUrl
    this.caption = caption
    this.mimeType = mimeType
    this.storageProvider = storageProvider
    this.relatedType = relatedType
    this.relatedId = relatedId
    this.createdAt = createdAt || new Date()
    this.updatedAt = updatedAt || new Date()
  }

  // --------- Helpers ---------

  hasAlternativeUrl(): boolean {
    return !!this.anotherUrl
  }

  hasCaption(): boolean {
    return !!this.caption
  }

  getMimeTypeDisplay(): string {
    return this.mimeType || 'Không xác định'
  }

  isImage(): boolean {
    return this.mimeType?.startsWith('image/') || false
  }

  isJpeg(): boolean {
    return this.mimeType === 'image/jpeg'
  }

  isPng(): boolean {
    return this.mimeType === 'image/png'
  }

  isWebp(): boolean {
    return this.mimeType === 'image/webp'
  }

  isSvg(): boolean {
    return this.mimeType === 'image/svg+xml'
  }

  getImageTypeDisplay(): string {
    if (this.isJpeg()) return 'JPEG Image'
    if (this.isPng()) return 'PNG Image'
    if (this.isWebp()) return 'WebP Image'
    if (this.isSvg()) return 'SVG Vector'
    return 'Unknown Image Format'
  }

  getStorageProviderDisplay(): string {
    switch (this.storageProvider) {
      case StorageProvider.S3:
        return 'Amazon S3'
      case StorageProvider.GCS:
        return 'Google Cloud Storage'
      case StorageProvider.LOCAL:
        return 'Local Storage'
      case StorageProvider.EXTERNAL:
        return 'External Storage'
      default:
        return 'Unknown'
    }
  }

  isExternalStorage(): boolean {
    return this.storageProvider === StorageProvider.EXTERNAL
  }

  hasAdminOwner(): boolean {
    return !!this.adminId
  }

  isRelatedTo(type: string, id: number): boolean {
    return this.relatedType === type && this.relatedId === id
  }

  hasRelation(): boolean {
    return !!this.relatedType && !!this.relatedId
  }

  getRelationDisplay(): string {
    if (!this.hasRelation()) {
      return 'Không có liên kết'
    }
    return `${this.relatedType} #${this.relatedId}`
  }
}
