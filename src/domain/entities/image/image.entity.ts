import { StorageProvider } from '@prisma/client'

export class Image {
  constructor(
    public readonly imageId: number,
    public readonly adminId?: number,
    public readonly url: string = '',
    public readonly anotherUrl?: string,
    public readonly mimeType?: string,
    public readonly storageProvider: StorageProvider = StorageProvider.EXTERNAL,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) { }

  hasAlternativeUrl(): boolean {
    return !!this.anotherUrl
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

  isCloudStorage(): boolean {
    return this.storageProvider === StorageProvider.S3 || this.storageProvider === StorageProvider.GCS
  }

  hasAdminOwner(): boolean {
    return !!this.adminId
  }

  getImageTypeDisplay(): string {
    if (this.isJpeg()) return 'JPEG Image'
    if (this.isPng()) return 'PNG Image'
    if (this.isWebp()) return 'WebP Image'
    if (this.isSvg()) return 'SVG Vector'
    return 'Unknown Image Format'
  }
}
