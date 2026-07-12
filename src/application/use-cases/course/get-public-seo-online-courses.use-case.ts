import { Injectable } from '@nestjs/common'
import { CourseType, MediaStatus, MediaVisibility, Visibility } from '@prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { CourseListQueryDto } from '../../dtos/course/course-list-query.dto'
import {
  PublicSeoMediaFileDto,
  PublicSeoCourseListResponseDto,
  PublicSeoCourseSummaryDto,
} from '../../dtos/course/public-seo-course.dto'
import { COURSE_MEDIA_FIELDS } from '../../../shared/constants'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { MinioService } from '../../../infrastructure/services/minio.service'

@Injectable()
export class GetPublicSeoOnlineCoursesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: CourseListQueryDto): Promise<PublicSeoCourseListResponseDto> {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(1000, Math.max(1, Number(query.limit) || 10))
    const skip = (page - 1) * limit
    const sortBy = this.getSortBy(query.sortBy)
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

    const where = {
      visibility: Visibility.PUBLISHED,
      courseType: {
        in: [CourseType.ONLINE, CourseType.ALL],
      },
      ...(query.grade !== undefined && { grade: query.grade }),
      ...(query.subjectId !== undefined && { subjectId: query.subjectId }),
      ...(query.teacherId !== undefined && { teacherId: query.teacherId }),
      ...(query.academicYear && { academicYear: query.academicYear }),
      ...(query.search && {
        OR: [
          { code: { contains: query.search } },
          { title: { contains: query.search } },
          { subtitle: { contains: query.search } },
          { description: { contains: query.search } },
        ],
      }),
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subject: true,
          teacher: {
            include: {
              user: true,
            },
          },
          lessons: {
            where: {
              visibility: Visibility.PUBLISHED,
            },
            select: {
              lessonId: true,
              allowTrial: true,
            },
          },
          _count: {
            select: {
              courseEnrollments: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ])
    const thumbnailByCourseId = await this.getCourseThumbnails(courses.map((course) => course.courseId))

    return new PublicSeoCourseListResponseDto(
      courses.map((course) =>
        mapPublicSeoCourseSummary(
          course,
          course.lessons.length,
          course.lessons.filter((lesson) => lesson.allowTrial).length,
          thumbnailByCourseId.get(course.courseId),
        ),
      ),
      page,
      limit,
      total,
    )
  }

  private getSortBy(sortBy?: string): string {
    const allowedSortFields = ['courseId', 'code', 'title', 'grade', 'priceVND', 'createdAt', 'updatedAt']
    return sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
  }

  private async getCourseThumbnails(courseIds: number[]): Promise<Map<number, PublicSeoMediaFileDto>> {
    const thumbnailByCourseId = new Map<number, PublicSeoMediaFileDto>()
    if (!courseIds.length) {
      return thumbnailByCourseId
    }

    const usages = await this.prisma.mediaUsage.findMany({
      where: {
        entityType: EntityType.COURSE,
        entityId: {
          in: courseIds,
        },
        fieldName: COURSE_MEDIA_FIELDS.THUMBNAIL,
        visibility: MediaVisibility.PUBLIC,
        media: {
          status: MediaStatus.READY,
        },
      },
      include: {
        media: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    for (const usage of usages) {
      thumbnailByCourseId.set(usage.entityId, await mapPublicSeoMediaFile(usage, this.minioService))
    }

    return thumbnailByCourseId
  }
}

export function mapPublicSeoCourseSummary(
  course: any,
  lessonsCount: number,
  trialLessonsCount: number,
  thumbnail?: PublicSeoMediaFileDto,
): PublicSeoCourseSummaryDto {
  const compareAtVND = course.compareAtVND ?? undefined
  const hasDiscount = compareAtVND !== undefined && compareAtVND > course.priceVND

  return {
    courseId: course.courseId,
    code: course.code,
    title: course.title,
    subtitle: course.subtitle ?? undefined,
    academicYear: course.academicYear ?? undefined,
    grade: course.grade ?? undefined,
    subjectId: course.subjectId ?? undefined,
    description: course.description ?? undefined,
    priceVND: course.priceVND,
    compareAtVND,
    visibility: course.visibility,
    isEnded: course.isEnded,
    courseType: course.courseType,
    teacherId: course.teacherId ?? undefined,
    subject: course.subject
        ? {
          subjectId: course.subject.subjectId,
          name: course.subject.name,
          code: course.subject.code ?? undefined,
        }
      : undefined,
    teacher: mapPublicSeoTeacher(course.teacher),
    lessonsCount,
    trialLessonsCount,
    enrollmentsCount: course._count?.courseEnrollments ?? 0,
    isFree: course.priceVND === 0,
    hasDiscount,
    discountPercentage: hasDiscount ? Math.round(((compareAtVND - course.priceVND) / compareAtVND) * 100) : undefined,
    thumbnail,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }
}

export function mapPublicSeoTeacher(admin: any) {
  if (!admin) {
    return undefined
  }

  const firstName = admin.user?.firstName ?? undefined
  const lastName = admin.user?.lastName ?? undefined
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || undefined

  return {
    adminId: admin.adminId,
    userId: admin.userId ?? admin.user?.userId ?? undefined,
    firstName,
    lastName,
    fullName,
    email: admin.user?.email ?? undefined,
  }
}

export async function mapPublicSeoMediaFile(
  usage: any,
  minioService: MinioService,
  expirySeconds = 3600,
): Promise<PublicSeoMediaFileDto> {
  const viewUrl = await minioService.getPresignedUrl(
    usage.media.bucketName,
    usage.media.objectKey,
    expirySeconds,
  )

  return {
    usageId: usage.usageId,
    mediaId: usage.media.mediaId,
    fileName: usage.media.fileName || usage.media.objectKey.split('/').pop() || usage.media.originalName,
    originalName: usage.media.originalName,
    mimeType: usage.media.mimeType,
    type: usage.media.type,
    viewUrl,
    expiresAt: new Date(Date.now() + expirySeconds * 1000),
    expirySeconds,
    width: usage.media.width,
    height: usage.media.height,
    duration: usage.media.duration,
  }
}
