import { Injectable } from '@nestjs/common'
import { CourseType, LearningItemType, MediaStatus, MediaVisibility, Visibility } from '@prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
  PublicSeoCourseDetailDto,
  PublicSeoCourseMediaDto,
  PublicSeoMediaFileDto,
} from '../../dtos/course/public-seo-course.dto'
import {
  mapPublicSeoCourseSummary,
  mapPublicSeoMediaFile,
  mapPublicSeoTeacher,
} from './get-public-seo-online-courses.use-case'
import { COURSE_MEDIA_FIELDS, DOCUMENT_MEDIA_FIELDS, VIDEO_MEDIA_FIELDS } from '../../../shared/constants'
import { MinioService } from '../../../infrastructure/services/minio.service'

@Injectable()
export class GetPublicSeoCourseDetailUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async execute(courseIdOrCode: string): Promise<BaseResponseDto<PublicSeoCourseDetailDto>> {
    const courseIdentifier = this.buildCourseIdentifier(courseIdOrCode)

    const course = await this.prisma.course.findFirst({
      where: {
        ...courseIdentifier,
        visibility: Visibility.PUBLISHED,
        courseType: {
          in: [CourseType.ONLINE, CourseType.ALL],
        },
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
        courseClasses: {
          orderBy: {
            classId: 'asc',
          },
        },
        courseAssistants: {
          include: {
            admin: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            courseAssistantId: 'asc',
          },
        },
        lessons: {
          where: {
            visibility: Visibility.PUBLISHED,
          },
          orderBy: {
            orderInCourse: 'asc',
          },
          include: {
            lessonChapters: {
              include: {
                chapter: true,
              },
            },
            learningItems: {
              orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' },
              ],
              include: {
                learningItem: {
                  include: {
                    homeworkContents: {
                      orderBy: {
                        createdAt: 'asc',
                      },
                    },
                    documentContents: {
                      orderBy: [
                        { orderInDocument: 'asc' },
                        { createdAt: 'asc' },
                      ],
                    },
                    youtubeContents: {
                      orderBy: {
                        createdAt: 'asc',
                      },
                    },
                    videoContents: {
                      orderBy: {
                        createdAt: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            courseEnrollments: true,
          },
        },
      },
    })

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học public online cho trang SEO')
    }

    const mediaFilesByDocumentContent = await this.getPublicMediaFilesByEntity(
      EntityType.DOCUMENT_CONTENT,
      this.collectDocumentContentIds(course.lessons),
      DOCUMENT_MEDIA_FIELDS.DOCUMENT_FILE,
      false,
    )
    const mediaFilesByVideoContent = await this.getPublicMediaFilesByEntity(
      EntityType.VIDEO_CONTENT,
      this.collectVideoContentIds(course.lessons),
      VIDEO_MEDIA_FIELDS.VIDEO_FILE,
      true,
    )

    const lessonsCount = course.lessons.length
    const trialLessonsCount = course.lessons.filter((lesson) => lesson.allowTrial).length
    const media = await this.getPublicCourseMedia(course.courseId)
    const summary = mapPublicSeoCourseSummary(course, lessonsCount, trialLessonsCount, media.thumbnail)

    return BaseResponseDto.success('Lấy chi tiết khóa học public online cho trang SEO thành công', {
      ...summary,
      media,
      classes: course.courseClasses.map((courseClass) => ({
        classId: courseClass.classId,
        className: courseClass.className,
        startDate: courseClass.startDate,
        endDate: courseClass.endDate,
        weeklySchedule: courseClass.weeklySchedule,
        room: courseClass.room,
      })),
      assistants: course.courseAssistants.map((assistant) => ({
        courseAssistantId: assistant.courseAssistantId,
        adminId: assistant.adminId,
        joinedAt: assistant.joinedAt,
        admin: mapPublicSeoTeacher(assistant.admin),
      })),
      lessons: course.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description ?? undefined,
        visibility: lesson.visibility,
        orderInCourse: lesson.orderInCourse,
        teacherId: lesson.teacherId ?? undefined,
        allowTrial: lesson.allowTrial,
        chapters: lesson.lessonChapters.map((lessonChapter) => ({
          chapterId: lessonChapter.chapterId,
          name: lessonChapter.chapter?.name,
          slug: lessonChapter.chapter?.slug,
          code: lessonChapter.chapter?.code ?? undefined,
          level: lessonChapter.chapter?.level,
        })),
        learningItems: lesson.allowTrial
          ? lesson.learningItems
            .filter((lessonLearningItem) => lessonLearningItem.learningItem.type !== LearningItemType.HOMEWORK)
            .map((lessonLearningItem) => {
              const learningItem = lessonLearningItem.learningItem

              return {
                lessonId: lessonLearningItem.lessonId,
                learningItemId: lessonLearningItem.learningItemId,
                order: lessonLearningItem.order ?? undefined,
                type: learningItem.type,
                title: learningItem.title,
                description: learningItem.description ?? undefined,
                homeworkContents: [],
                documentContents: learningItem.documentContents.map((content) => {
                  const mediaFiles = mediaFilesByDocumentContent.get(content.documentContentId) ?? []

                  return {
                    documentContentId: content.documentContentId,
                    learningItemId: content.learningItemId,
                    content: content.content,
                    orderInDocument: content.orderInDocument,
                    mediaFiles,
                    createdAt: content.createdAt,
                    updatedAt: content.updatedAt,
                  }
                }),
                youtubeContents: learningItem.youtubeContents.map((content) => ({
                  youtubeContentId: content.youtubeContentId,
                  learningItemId: content.learningItemId,
                  content: content.content,
                  youtubeUrl: content.youtubeUrl,
                  createdAt: content.createdAt,
                  updatedAt: content.updatedAt,
                })),
                videoContents: learningItem.videoContents.map((content) => ({
                  videoContentId: content.videoContentId,
                  learningItemId: content.learningItemId,
                  content: content.content,
                  mediaFiles: mediaFilesByVideoContent.get(content.videoContentId) ?? [],
                  createdAt: content.createdAt,
                  updatedAt: content.updatedAt,
                })),
                createdAt: learningItem.createdAt,
                updatedAt: learningItem.updatedAt,
              }
            })
          : [],
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      })),
    })
  }

  private buildCourseIdentifier(courseIdOrCode: string) {
    if (/^\d+$/.test(courseIdOrCode)) {
      return {
        courseId: Number(courseIdOrCode),
      }
    }

    return {
      code: courseIdOrCode,
    }
  }

  private collectDocumentContentIds(lessons: any[]): number[] {
    return lessons.flatMap((lesson) =>
      lesson.allowTrial
        ? lesson.learningItems
          .filter((lessonLearningItem) => lessonLearningItem.learningItem.type !== LearningItemType.HOMEWORK)
          .flatMap((lessonLearningItem) =>
            lessonLearningItem.learningItem.documentContents.map((content) => content.documentContentId),
          )
        : [],
    )
  }

  private collectVideoContentIds(lessons: any[]): number[] {
    return lessons.flatMap((lesson) =>
      lesson.allowTrial
        ? lesson.learningItems
          .filter((lessonLearningItem) => lessonLearningItem.learningItem.type !== LearningItemType.HOMEWORK)
          .flatMap((lessonLearningItem) =>
            lessonLearningItem.learningItem.videoContents.map((content) => content.videoContentId),
          )
        : [],
    )
  }

  private async getPublicMediaFilesByEntity(
    entityType: EntityType,
    entityIds: number[],
    fieldName?: string,
    requirePublicVisibility = true,
  ): Promise<Map<number, PublicSeoMediaFileDto[]>> {
    const uniqueEntityIds = [...new Set(entityIds)]
    const mediaFilesByEntity = new Map<number, PublicSeoMediaFileDto[]>()

    if (uniqueEntityIds.length === 0) {
      return mediaFilesByEntity
    }

    const usages = await this.prisma.mediaUsage.findMany({
      where: {
        entityType,
        entityId: {
          in: uniqueEntityIds,
        },
        ...(fieldName && { fieldName }),
        ...(requirePublicVisibility && { visibility: MediaVisibility.PUBLIC }),
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
      const mediaFiles = mediaFilesByEntity.get(usage.entityId) ?? []
      mediaFiles.push(await mapPublicSeoMediaFile(usage, this.minioService))
      mediaFilesByEntity.set(usage.entityId, mediaFiles)
    }

    return mediaFilesByEntity
  }

  private async getPublicCourseMedia(courseId: number): Promise<PublicSeoCourseMediaDto> {
    const media: PublicSeoCourseMediaDto = {
      gallery: [],
    }

    const usages = await this.prisma.mediaUsage.findMany({
      where: {
        entityType: EntityType.COURSE,
        entityId: courseId,
        fieldName: {
          in: [
            COURSE_MEDIA_FIELDS.THUMBNAIL,
            COURSE_MEDIA_FIELDS.BANNER,
            COURSE_MEDIA_FIELDS.INTRO_VIDEO,
            COURSE_MEDIA_FIELDS.GALLERY,
          ],
        },
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
      const mediaFile = await mapPublicSeoMediaFile(usage, this.minioService)
      if (usage.fieldName === COURSE_MEDIA_FIELDS.THUMBNAIL) {
        media.thumbnail = mediaFile
      }

      if (usage.fieldName === COURSE_MEDIA_FIELDS.BANNER) {
        media.banner = mediaFile
      }

      if (usage.fieldName === COURSE_MEDIA_FIELDS.INTRO_VIDEO) {
        media.introVideo = mediaFile
      }

      if (usage.fieldName === COURSE_MEDIA_FIELDS.GALLERY) {
        media.gallery.push(mediaFile)
      }
    }

    return media
  }
}
