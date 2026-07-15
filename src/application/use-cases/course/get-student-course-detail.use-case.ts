// src/application/use-cases/course/get-student-course-detail.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import type { ICourseEnrollmentRepository } from '../../../domain/repositories/course-enrollment.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentCourseDetailResponseDto } from '../../dtos/course/student-course-detail.dto'
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { CourseType, CourseVisibility } from 'src/shared/enums'
import { MediaStatus } from '@prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { COURSE_MEDIA_FIELDS } from '../../../shared/constants'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import type { PublicSeoCourseMediaDto } from '../../dtos/course/public-seo-course.dto'
import { mapPublicSeoMediaFile } from './get-public-seo-online-courses.use-case'
import { getTeacherAvatarUrls } from './course-teacher-avatar.util'

@Injectable()
export class GetStudentCourseDetailUseCase {
  constructor(
    @Inject('ICourseRepository')
    private readonly courseRepository: ICourseRepository,
    @Inject('ICourseEnrollmentRepository')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async execute(courseId: number, studentId: number): Promise<BaseResponseDto<StudentCourseDetailResponseDto>> {
    const course = await this.courseRepository.findById(courseId)

    if (!course) {
      throw new NotFoundException('Khong tim thay khoa hoc')
    }

    if (course.visibility === CourseVisibility.DRAFT) {
      throw new ConflictException('Khoa hoc nay chua duoc cong bo')
    }

    const enrollment = await this.courseEnrollmentRepository.findByCourseAndStudent(courseId, studentId)
    const isActiveEnrollment = Boolean(enrollment?.isActive())

    if (!isActiveEnrollment && course.courseType === CourseType.OFFLINE) {
      throw new ForbiddenException('Ban chua dang ky khoa hoc nay')
    }

    const media = await this.getPublicCourseMedia(course.courseId)
    const teacherUserId = course.teacher?.userId ?? course.teacher?.user?.userId
    const teacherAvatarUrl = teacherUserId
      ? (await getTeacherAvatarUrls(this.prisma, this.minioService, [teacherUserId])).get(teacherUserId)
      : undefined

    const courseResponse = StudentCourseDetailResponseDto.fromEntity(course, {
      isEnrolled: isActiveEnrollment,
      enrolledAt: isActiveEnrollment ? enrollment?.enrolledAt : undefined,
      status: isActiveEnrollment ? enrollment?.status : undefined,
      isPaidFull: isActiveEnrollment ? enrollment?.isPaidFull : undefined,
      media,
      teacherAvatarUrl,
    })

    return {
      success: true,
      message: 'Lay thong tin khoa hoc thanh cong',
      data: courseResponse,
    }
  }

  private async getPublicCourseMedia(courseId: number): Promise<PublicSeoCourseMediaDto> {
    const media: PublicSeoCourseMediaDto = { gallery: [] }
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

      if (usage.fieldName === COURSE_MEDIA_FIELDS.THUMBNAIL) media.thumbnail = mediaFile
      if (usage.fieldName === COURSE_MEDIA_FIELDS.BANNER) media.banner = mediaFile
      if (usage.fieldName === COURSE_MEDIA_FIELDS.INTRO_VIDEO) media.introVideo = mediaFile
      if (usage.fieldName === COURSE_MEDIA_FIELDS.GALLERY) media.gallery.push(mediaFile)
    }

    return media
  }
}
