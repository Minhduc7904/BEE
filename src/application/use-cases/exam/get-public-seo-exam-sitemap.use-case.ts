import { Injectable } from '@nestjs/common'
import { ExamVisibility } from '@prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { PublicSeoSitemapQueryDto, PublicSeoSitemapResponseDto } from '../../dtos/seo/public-seo-sitemap.dto'

@Injectable()
export class GetPublicSeoExamSitemapUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: PublicSeoSitemapQueryDto): Promise<PublicSeoSitemapResponseDto> {
    const page = query.page ?? 1
    const limit = query.limit ?? 1000
    const where = { visibility: ExamVisibility.PUBLISHED, slug: { not: null } }
    const [entries, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ updatedAt: query.sortOrder ?? 'desc' }, { slug: 'asc' }],
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.exam.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    return {
      success: true,
      data: entries.map((entry) => ({ slug: entry.slug!, updatedAt: entry.updatedAt })),
      meta: { page, limit, total, totalPages, hasPrevious: page > 1, hasNext: page < totalPages },
    }
  }
}
