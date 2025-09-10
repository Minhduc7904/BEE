import { Injectable } from '@nestjs/common';
import { IDocumentRepository, CreateDocumentData } from '../../domain/repositories/document.repository';
import { Document } from '../../domain/entities/document/document.entity';
import { NumberUtil } from '../../shared/utils/number.util';
import { DocumentMapper } from '../mappers/document.mapper';

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
                subjectId: data.subjectId,
                relatedType: data.relatedType,
                relatedId: data.relatedId,
                storageProvider: data.storageProvider,
            },
            include: {
                subject: true,
                admin: true,
            },
        });

        return DocumentMapper.toDomainDocument(created)!;
    }

    async findById(id: number): Promise<Document | null> {
        const numericId = NumberUtil.ensureValidId(id, 'Document ID');

        const document = await this.prisma.document.findUnique({
            where: { documentId: numericId },
            include: {
                subject: true,
                admin: true,
            },
        });

        return DocumentMapper.toDomainDocument(document);
    }

    async findAll(limit = 10, offset = 0): Promise<Document[]> {
        const documents = await this.prisma.document.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            include: {
                subject: true,
                admin: true,
            },
        });

        return DocumentMapper.toDomainDocuments(documents);
    }

    async update(id: number, data: Partial<CreateDocumentData>): Promise<Document> {
        const numericId = NumberUtil.ensureValidId(id, 'Document ID');

        const updated = await this.prisma.document.update({
            where: { documentId: numericId },
            data,
            include: {
                subject: true,
                admin: true,
            },
        });

        return DocumentMapper.toDomainDocument(updated)!;
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
            include: {
                subject: true,
                admin: true,
            },
        });

        return DocumentMapper.toDomainDocuments(documents);
    }
}