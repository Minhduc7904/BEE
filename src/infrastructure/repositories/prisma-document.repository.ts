import { Injectable } from '@nestjs/common';
import { IDocumentRepository, CreateDocumentData } from '../../domain/repositories/document.repository';
import { Document } from '../../domain/entities/document/document.entity';
import { NumberUtil } from '../../shared/utils/number.util';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
    constructor(private readonly prisma: any) { } // PrismaClient or TransactionClient

    async create(data: CreateDocumentData): Promise<Document> {
        const numericAdminId = NumberUtil.ensureValidId(data.adminId, 'Admin ID');
        
        const created = await this.prisma.document.create({
            data: {
                adminId: numericAdminId,
                description: data.description,
                url: data.url,
                anotherUrl: data.anotherUrl,
                mimeType: data.mimeType,
                subject: data.subject,
                relatedType: data.relatedType,
                relatedId: data.relatedId,
                storageProvider: data.storageProvider,
            },
        });

        return new Document(
            created.documentId,
            created.url,
            created.storageProvider,
            created.createdAt,
            created.updatedAt,
            created.adminId,
            created.description,
            created.anotherUrl,
            created.mimeType,
            created.subject,
            created.relatedType,
            created.relatedId
        );
    }

    async findById(id: number): Promise<Document | null> {
        const numericId = NumberUtil.ensureValidId(id, 'Document ID');
        
        const document = await this.prisma.document.findUnique({
            where: { documentId: numericId },
        });

        return document ? new Document(
            document.documentId,
            document.url,
            document.storageProvider,
            document.createdAt,
            document.updatedAt,
            document.adminId,
            document.description,
            document.anotherUrl,
            document.mimeType,
            document.subject,
            document.relatedType,
            document.relatedId
        ) : null;
    }

    async findAll(limit = 10, offset = 0): Promise<Document[]> {
        const documents = await this.prisma.document.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });

        return documents.map((doc: any) => new Document(
            doc.documentId,
            doc.url,
            doc.storageProvider,
            doc.createdAt,
            doc.updatedAt,
            doc.adminId,
            doc.description,
            doc.anotherUrl,
            doc.mimeType,
            doc.subject,
            doc.relatedType,
            doc.relatedId
        ));
    }

    async update(id: number, data: Partial<CreateDocumentData>): Promise<Document> {
        const numericId = NumberUtil.ensureValidId(id, 'Document ID');
        
        const updated = await this.prisma.document.update({
            where: { documentId: numericId },
            data,
        });

        return new Document(
            updated.documentId,
            updated.url,
            updated.storageProvider,
            updated.createdAt,
            updated.updatedAt,
            updated.adminId,
            updated.description,
            updated.anotherUrl,
            updated.mimeType,
            updated.subject,
            updated.relatedType,
            updated.relatedId
        );
    }

    async delete(id: number): Promise<void> {
        const numericId = NumberUtil.ensureValidId(id, 'Document ID');
        
        await this.prisma.document.delete({
            where: { documentId: numericId },
        });
    }

    async findByRelated(relatedType: string, relatedId: number): Promise<Document[]> {
        const numericRelatedId = NumberUtil.ensureValidId(relatedId, 'Related ID');
        
        const documents = await this.prisma.document.findMany({
            where: {
                relatedType,
                relatedId: numericRelatedId,
            },
            orderBy: { createdAt: 'desc' },
        });

        return documents.map((doc: any) => new Document(
            doc.documentId,
            doc.url,
            doc.storageProvider,
            doc.createdAt,
            doc.updatedAt,
            doc.adminId,
            doc.description,
            doc.anotherUrl,
            doc.mimeType,
            doc.subject,
            doc.relatedType,
            doc.relatedId
        ));
    }
}