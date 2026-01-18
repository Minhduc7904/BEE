// src/infrastructure/repositories/prisma-document-content.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IDocumentContentRepository } from '../../../domain/repositories'
import type {
    CreateDocumentContentData,
    UpdateDocumentContentData,
    DocumentContentFilterOptions,
    DocumentContentPaginationOptions,
    DocumentContentListResult,
} from '../../../domain/interface'
import { DocumentContent } from '../../../domain/entities'
import { DocumentContentMapper } from '../../mappers/learning-item/document-content.mapper'
import { NumberUtil } from '../../../shared/utils'

export class PrismaDocumentContentRepository implements IDocumentContentRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateDocumentContentData): Promise<DocumentContent> {
        const prismaDocumentContent = await this.prisma.documentContent.create({
            data: {
                learningItemId: data.learningItemId,
                content: data.content,
                orderInDocument: data.orderInDocument,
            },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return DocumentContentMapper.toDomainDocumentContent(prismaDocumentContent)!
    }

    async findById(id: number): Promise<DocumentContent | null> {
        const numericId = NumberUtil.ensureValidId(id, 'DocumentContent ID')

        const prismaDocumentContent = await this.prisma.documentContent.findUnique({
            where: { documentContentId: numericId },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        if (!prismaDocumentContent) return null
        return DocumentContentMapper.toDomainDocumentContent(prismaDocumentContent)!
    }

    async update(id: number, data: UpdateDocumentContentData): Promise<DocumentContent> {
        const numericId = NumberUtil.ensureValidId(id, 'DocumentContent ID')

        const prismaDocumentContent = await this.prisma.documentContent.update({
            where: { documentContentId: numericId },
            data: {
                ...data,
            },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return DocumentContentMapper.toDomainDocumentContent(prismaDocumentContent)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'DocumentContent ID')

        await this.prisma.documentContent.delete({
            where: { documentContentId: numericId },
        })

        return true
    }

    async findAll(): Promise<DocumentContent[]> {
        const prismaDocumentContents = await this.prisma.documentContent.findMany({
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return DocumentContentMapper.toDomainDocumentContents(prismaDocumentContents)
    }

    async findAllWithPagination(
        pagination: DocumentContentPaginationOptions,
        filters?: DocumentContentFilterOptions,
    ): Promise<DocumentContentListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (filters?.learningItemId) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
            ]
        }

        // Execute query with pagination
        const [prismaDocumentContents, total] = await Promise.all([
            this.prisma.documentContent.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    learningItem: {
                        include: {
                            admin: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.documentContent.count({ where }),
        ])

        const documentContents = DocumentContentMapper.toDomainDocumentContents(prismaDocumentContents)

        return {
            documentContents,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async searchDocumentContents(
        searchTerm: string,
        pagination?: DocumentContentPaginationOptions,
    ): Promise<DocumentContentListResult> {
        return this.findAllWithPagination(
            pagination || {},
            { search: searchTerm },
        )
    }

    async findByFilters(
        filters: DocumentContentFilterOptions,
        pagination?: DocumentContentPaginationOptions,
    ): Promise<DocumentContentListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByLearningItem(learningItemId: number): Promise<DocumentContent[]> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        const prismaDocumentContents = await this.prisma.documentContent.findMany({
            where: { learningItemId: numericId },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
            orderBy: { orderInDocument: 'asc' },
        })

        return DocumentContentMapper.toDomainDocumentContents(prismaDocumentContents)
    }

    async count(filters?: DocumentContentFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.learningItemId) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
            ]
        }

        return this.prisma.documentContent.count({ where })
    }

    async countByLearningItem(learningItemId: number): Promise<number> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        return this.prisma.documentContent.count({
            where: { learningItemId: numericId },
        })
    }
}
