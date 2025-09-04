import { StorageProvider } from '@prisma/client';

export class QuestionImage {
  constructor(
    public readonly imageId: number,
    public readonly adminId?: number,
    public readonly url: string = '',
    public readonly anotherUrl?: string,
    public readonly mimeType?: string,
    public readonly storageProvider: StorageProvider = StorageProvider.EXTERNAL,
    public readonly relatedType?: string,
    public readonly relatedId?: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  hasAlternativeUrl(): boolean {
    return !!this.anotherUrl;
  }

  getMimeTypeDisplay(): string {
    return this.mimeType || 'Không xác định';
  }

  isImage(): boolean {
    return this.mimeType?.startsWith('image/') || false;
  }

  isJpeg(): boolean {
    return this.mimeType === 'image/jpeg';
  }

  isPng(): boolean {
    return this.mimeType === 'image/png';
  }

  isWebp(): boolean {
    return this.mimeType === 'image/webp';
  }

  getStorageProviderDisplay(): string {
    switch (this.storageProvider) {
      case StorageProvider.S3:
        return 'Amazon S3';
      case StorageProvider.GCS:
        return 'Google Cloud Storage';
      case StorageProvider.LOCAL:
        return 'Local Storage';
      case StorageProvider.EXTERNAL:
        return 'External Storage';
      default:
        return 'Unknown';
    }
  }

  isExternalStorage(): boolean {
    return this.storageProvider === StorageProvider.EXTERNAL;
  }

  hasAdminOwner(): boolean {
    return !!this.adminId;
  }

  isRelatedTo(type: string, id: number): boolean {
    return this.relatedType === type && this.relatedId === id;
  }

  hasRelation(): boolean {
    return !!this.relatedType && !!this.relatedId;
  }

  getRelationDisplay(): string {
    if (!this.hasRelation()) {
      return 'Không có liên kết';
    }
    return `${this.relatedType} #${this.relatedId}`;
  }
}
