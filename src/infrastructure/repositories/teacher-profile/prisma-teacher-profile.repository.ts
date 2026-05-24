import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  CreateTeacherProfileData,
  ITeacherProfileRepository,
  TeacherProfileListOptions,
  UpdateTeacherProfileData,
} from 'src/domain/repositories/teacher-profile.repository'
import { TeacherProfileEntity } from 'src/domain/entities'
import { TeacherProfileMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaTeacherProfileRepository implements ITeacherProfileRepository {
  constructor(private readonly prisma: Prismaish) {}

  async create(data: CreateTeacherProfileData): Promise<TeacherProfileEntity> {
    const teacherProfile = await (this.prisma as any).teacherProfile.create({ data })

    return TeacherProfileMapper.toDomain(teacherProfile)
  }

  async findById(teacherProfileId: number): Promise<TeacherProfileEntity | null> {
    const teacherProfile = await (this.prisma as any).teacherProfile.findUnique({
      where: { teacherProfileId },
    })

    return teacherProfile ? TeacherProfileMapper.toDomain(teacherProfile) : null
  }

  async findBySlug(slug: string): Promise<TeacherProfileEntity | null> {
    const teacherProfile = await (this.prisma as any).teacherProfile.findUnique({
      where: { slug },
    })

    return teacherProfile ? TeacherProfileMapper.toDomain(teacherProfile) : null
  }

  async findAllWithPagination(options: TeacherProfileListOptions): Promise<{
    data: TeacherProfileEntity[]
    total: number
  }> {
    const where = this.buildWhere(options)

    const [teacherProfiles, total] = await Promise.all([
      (this.prisma as any).teacherProfile.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: {
          [options.sortBy]: options.sortOrder,
        },
      }),
      (this.prisma as any).teacherProfile.count({ where }),
    ])

    return {
      data: TeacherProfileMapper.toDomainList(teacherProfiles),
      total,
    }
  }

  async update(
    teacherProfileId: number,
    data: UpdateTeacherProfileData,
  ): Promise<TeacherProfileEntity> {
    const teacherProfile = await (this.prisma as any).teacherProfile.update({
      where: { teacherProfileId },
      data,
    })

    return TeacherProfileMapper.toDomain(teacherProfile)
  }

  async incrementViewCount(teacherProfileId: number): Promise<TeacherProfileEntity> {
    const teacherProfile = await (this.prisma as any).teacherProfile.update({
      where: { teacherProfileId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return TeacherProfileMapper.toDomain(teacherProfile)
  }

  async delete(teacherProfileId: number): Promise<void> {
    await (this.prisma as any).teacherProfile.delete({
      where: { teacherProfileId },
    })
  }

  private buildWhere(options: TeacherProfileListOptions) {
    const where: any = {}

    if (options.search) {
      where.OR = [
        { displayName: { contains: options.search } },
        { slug: { contains: options.search } },
        { headline: { contains: options.search } },
        { shortDescription: { contains: options.search } },
        { bio: { contains: options.search } },
        { expertise: { contains: options.search } },
        { teachingSubjects: { contains: options.search } },
        { teachingMethods: { contains: options.search } },
        { targetKeyword: { contains: options.search } },
        { keywordText: { contains: options.search } },
        { metaTitle: { contains: options.search } },
        { metaDescription: { contains: options.search } },
      ]
    }

    if (options.visibility) {
      where.visibility = options.visibility
    }

    if (options.isFeatured !== undefined) {
      where.isFeatured = options.isFeatured
    }

    return Object.keys(where).length > 0 ? where : undefined
  }

}
