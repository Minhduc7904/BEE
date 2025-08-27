import { StorageProvider } from '../../constants/storage-provider.constant';


export class Document {
    documentId: number;
    adminId?: number;
    description?: string;
    url: string;
    anotherUrl?: string;
    mimeType?: string;
    subject?: string;
    relatedType?: string;
    relatedId?: number;
    storageProvider: StorageProvider;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<Document>) {
        Object.assign(this, data);
    }
}