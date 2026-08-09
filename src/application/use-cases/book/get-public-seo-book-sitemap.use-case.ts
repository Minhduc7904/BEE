import { Injectable } from '@nestjs/common'
import { Visibility } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { PublicSeoSitemapQueryDto, PublicSeoSitemapResponseDto } from 'src/application/dtos'

@Injectable()
export class GetPublicSeoBookSitemapUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: PublicSeoSitemapQueryDto): Promise<PublicSeoSitemapResponseDto> {
    const page = query.page ?? 1
    const limit = query.limit ?? 1000
    const where = { visibility: Visibility.PUBLISHED }
    const [data, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ updatedAt: query.sortOrder ?? 'desc' }, { slug: 'asc' }],
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.book.count({ where }),
    ])
    const totalPages = Math.ceil(total / limit)
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages, hasPrevious: page > 1, hasNext: page < totalPages },
    }
  }
}
