import { Injectable } from '@nestjs/common'
import { CourseType, Visibility } from '@prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { PublicSeoSitemapQueryDto, PublicSeoSitemapResponseDto } from '../../dtos/seo/public-seo-sitemap.dto'

@Injectable()
export class GetPublicSeoCourseSitemapUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: PublicSeoSitemapQueryDto): Promise<PublicSeoSitemapResponseDto> {
    const page = query.page ?? 1
    const limit = query.limit ?? 1000
    const where = {
      visibility: Visibility.PUBLISHED,
      courseType: { in: [CourseType.ONLINE, CourseType.ALL] },
    }
    const [entries, total] = await Promise.all([
      this.prisma.course.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: [{ updatedAt: query.sortOrder ?? 'desc' }, { code: 'asc' }],
        select: { code: true, updatedAt: true },
      }),
      this.prisma.course.count({ where }),
    ])
    const totalPages = Math.ceil(total / limit)
    return {
      success: true,
      data: entries.map((entry) => ({ slug: entry.code, updatedAt: entry.updatedAt })),
      meta: { page, limit, total, totalPages, hasPrevious: page > 1, hasNext: page < totalPages },
    }
  }
}
