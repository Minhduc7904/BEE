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
}
