import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { DocumentTagEntity } from 'src/domain/entities'
import { IDocumentTagRepository } from 'src/domain/repositories/document-tag.repository'
import { DocumentTagMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaDocumentTagRepository implements IDocumentTagRepository {
  constructor(private readonly prisma: Prismaish) {}

  async setDocumentTags(documentId: number, tagIds: number[]): Promise<DocumentTagEntity[]> {
    await (this.prisma as any).documentTag.deleteMany({
      where: { documentId },
    })

    const uniqueTagIds = Array.from(new Set(tagIds))

    if (uniqueTagIds.length > 0) {
      await (this.prisma as any).documentTag.createMany({
        data: uniqueTagIds.map((tagId, index) => ({
          documentId,
          tagId,
          sortOrder: index,
        })),
      })
    }

    const documentTags = await (this.prisma as any).documentTag.findMany({
      where: { documentId },
      include: { tag: true },
      orderBy: { sortOrder: 'asc' },
    })

    return DocumentTagMapper.toDomainList(documentTags, { includeTag: true })
  }
}
