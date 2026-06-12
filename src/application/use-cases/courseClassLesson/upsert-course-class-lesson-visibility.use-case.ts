import { Injectable } from '@nestjs/common'
import { UpsertCourseClassLessonVisibilityDto } from '../../dtos/courseClassLesson'
import { CourseClassLessonResponseDto } from '../../dtos/courseClassLesson/course-class-lesson.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { PrismaService } from '../../../prisma/prisma.service'
import {
  ConflictException,
  NotFoundException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpsertCourseClassLessonVisibilityUseCase {
  constructor(private readonly prisma: PrismaService) { }

  async execute(
    dto: UpsertCourseClassLessonVisibilityDto,
  ): Promise<BaseResponseDto<CourseClassLessonResponseDto>> {
    const [courseClass, lesson, existing] = await Promise.all([
      this.prisma.courseClass.findUnique({
        where: { classId: dto.classId },
        select: {
          classId: true,
          courseId: true,
        },
      }),
      this.prisma.lesson.findUnique({
        where: { lessonId: dto.lessonId },
        select: {
          lessonId: true,
          courseId: true,
        },
      }),
      this.prisma.courseClassLesson.findUnique({
        where: {
          classId_lessonId: {
            classId: dto.classId,
            lessonId: dto.lessonId,
          },
        },
      }),
    ])

    if (!courseClass) {
      throw new NotFoundException('Không tìm thấy lớp học')
    }

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học')
    }

    if (courseClass.courseId !== lesson.courseId) {
      throw new ConflictException('Lớp học và bài học không thuộc cùng một khóa học')
    }

    const availableFrom = this.parseOptionalDate(dto.availableFrom)
    const availableUntil = this.parseOptionalDate(dto.availableUntil)
    if (
      availableFrom !== undefined &&
      availableUntil !== undefined &&
      availableFrom !== null &&
      availableUntil !== null &&
      availableFrom > availableUntil
    ) {
      throw new ValidationException('Thời gian bắt đầu hiển thị phải nhỏ hơn thời gian kết thúc hiển thị')
    }

    const action = existing ? 'UPDATED' : 'CREATED'
    const updateData: any = {
      isVisible: dto.isVisible,
    }

    if (dto.displayOrder !== undefined) {
      updateData.displayOrder = dto.displayOrder
    }

    if (availableFrom !== undefined) {
      updateData.availableFrom = availableFrom
    }

    if (availableUntil !== undefined) {
      updateData.availableUntil = availableUntil
    }

    const courseClassLesson = await this.prisma.courseClassLesson.upsert({
      where: {
        classId_lessonId: {
          classId: dto.classId,
          lessonId: dto.lessonId,
        },
      },
      create: {
        classId: dto.classId,
        lessonId: dto.lessonId,
        isVisible: dto.isVisible,
        displayOrder: dto.displayOrder ?? null,
        availableFrom: availableFrom ?? null,
        availableUntil: availableUntil ?? null,
      },
      update: updateData,
    })

    return BaseResponseDto.success(
      action === 'CREATED'
        ? 'Tạo cấu hình hiển thị bài học theo lớp thành công'
        : 'Cập nhật cấu hình hiển thị bài học theo lớp thành công',
      CourseClassLessonResponseDto.fromPrisma(courseClassLesson, action),
    )
  }

  private parseOptionalDate(value?: string | null): Date | null | undefined {
    if (value === undefined) {
      return undefined
    }

    if (value === null) {
      return null
    }

    return new Date(value)
  }
}
