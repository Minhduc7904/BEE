import { Injectable } from '@nestjs/common';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import { Document } from '../../domain/entities/document.entity';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
    constructor(private readonly prisma: any) { } // PrismaClient or TransactionClient

    async create(document: Omit<Document, 'documentId' | 'createdAt' | 'updatedAt'>): Promise<Document> {
        const created = await this.prisma.document.create({
            data: {
                adminId: document.adminId,
                description: document.description,
                url: document.url,
                anotherUrl: document.anotherUrl,
                mimeType: document.mimeType,
                subject: document.subject,
                relatedType: document.relatedType,
                relatedId: document.relatedId,
                storageProvider: document.storageProvider,
            },
        });

        return new Document(created);
    }

    async findById(id: number): Promise<Document | null> {
        const document = await this.prisma.document.findUnique({
            where: { documentId: id },
        });

        return document ? new Document(document) : null;
    }

    async findAll(limit = 10, offset = 0): Promise<Document[]> {
        const documents = await this.prisma.document.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });

        return documents.map((doc: any) => new Document(doc));
    }

    async update(id: number, data: Partial<Document>): Promise<Document> {
        const updated = await this.prisma.document.update({
            where: { documentId: id },
            data,
        });

        return new Document(updated);
    }

    async delete(id: number): Promise<void> {
        await this.prisma.document.delete({
            where: { documentId: id },
        });
    }

    async findByRelated(relatedType: string, relatedId: number): Promise<Document[]> {
        const documents = await this.prisma.document.findMany({
            where: {
                relatedType,
                relatedId,
            },
            orderBy: { createdAt: 'desc' },
        });

        return documents.map((doc: any) => new Document(doc));
    }
}