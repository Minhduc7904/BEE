import { StorageProvider } from '../../../shared/enums/storage-provider.enum';

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

    constructor(
        documentId: number,
        url: string,
        storageProvider: StorageProvider,
        createdAt: Date,
        updatedAt: Date,
        adminId?: number,
        description?: string,
        anotherUrl?: string,
        mimeType?: string,
        subject?: string,
        relatedType?: string,
        relatedId?: number
    ) {
        this.documentId = documentId;
        this.adminId = adminId;
        this.description = description;
        this.url = url;
        this.anotherUrl = anotherUrl;
        this.mimeType = mimeType;
        this.subject = subject;
        this.relatedType = relatedType;
        this.relatedId = relatedId;
        this.storageProvider = storageProvider;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    hasDescription(): boolean {
        return !!this.description;
    }

    getDescriptionDisplay(): string {
        return this.description || 'Không có mô tả';
    }

    hasSubject(): boolean {
        return !!this.subject;
    }

    getSubjectDisplay(): string {
        return this.subject || 'Chưa xác định môn học';
    }

    isRelatedTo(type: string, id: number): boolean {
        return this.relatedType === type && this.relatedId === id;
    }

    hasAlternativeUrl(): boolean {
        return !!this.anotherUrl;
    }

    getMimeTypeDisplay(): string {
        return this.mimeType || 'Không xác định';
    }

    isImage(): boolean {
        return this.mimeType?.startsWith('image/') || false;
    }

    isPdf(): boolean {
        return this.mimeType === 'application/pdf';
    }
}