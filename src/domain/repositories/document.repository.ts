import { Document } from '../entities/document.entity';

export interface IDocumentRepository {
    create(document: Omit<Document, 'documentId' | 'createdAt' | 'updatedAt'>): Promise<Document>;
    findById(id: number): Promise<Document | null>;
    findAll(limit?: number, offset?: number): Promise<Document[]>;
    update(id: number, data: Partial<Document>): Promise<Document>;
    delete(id: number): Promise<void>;
    findByRelated(relatedType: string, relatedId: number): Promise<Document[]>;
}