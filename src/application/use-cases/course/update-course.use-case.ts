// src/application/use-cases/course/update-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { UpdateCourseBasicInfoDto, UpdateCoursePricingDto } from '../../dtos/course/update-course.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  // =========================
  // BASIC INFO
  // =========================
  async executeBasicInfo(
    courseId: number,
    dto: UpdateCourseBasicInfoDto,
    adminId?: number,
  ): Promise<BaseResponseDto<CourseResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { course, courseRepository } = await this.validateAndGetCourse(courseId, repos, adminId)

      const updatedCourse = await courseRepository.update(courseId, {
        ...dto,
      })

      await this.logSuccess(
        repos,
        adminId,
        courseId,
        {
          title: course.title,
          visibility: course.visibility,
        },
        {
          title: updatedCourse.title,
          visibility: updatedCourse.visibility,
        },
      )

      return CourseResponseDto.fromEntity(updatedCourse)
    })

    return {
      success: true,
      message: 'Cập nhật thông tin cơ bản khóa học thành công',
      data: result,
    }
  }

  // =========================
  // PRICING
  // =========================
  async executePricing(
    courseId: number,
    dto: UpdateCoursePricingDto,
    adminId?: number,
  ): Promise<BaseResponseDto<CourseResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { course, courseRepository } = await this.validateAndGetCourse(courseId, repos, adminId)

      const newPrice = dto.priceVND ?? course.priceVND
      const newCompareAt = dto.compareAtVND ?? course.compareAtVND

      if (newCompareAt && newCompareAt <= newPrice) {
        await this.logFail(repos, adminId, courseId, 'Giá gốc phải lớn hơn giá bán')
        throw new ConflictException('Giá gốc phải lớn hơn giá bán')
      }

      const updatedCourse = await courseRepository.update(courseId, {
        ...dto,
      })

      await this.logSuccess(
        repos,
        adminId,
        courseId,
        {
          priceVND: course.priceVND,
          compareAtVND: course.compareAtVND,
        },
        {
          priceVND: updatedCourse.priceVND,
          compareAtVND: updatedCourse.compareAtVND,
        },
      )

      return CourseResponseDto.fromEntity(updatedCourse)
    })

    return {
      success: true,
      message: 'Cập nhật thông tin học phí thành công',
      data: result,
    }
  }

  // =========================
  // SHARED LOGIC
  // =========================
  private async validateAndGetCourse(courseId: number, repos: any, adminId?: number) {
    const { courseRepository, adminAuditLogRepository } = repos

    const course = await courseRepository.findById(courseId)

    if (!course) {
      await this.logFail(repos, adminId, courseId, 'Không tìm thấy khóa học')
      throw new NotFoundException('Không tìm thấy khóa học')
    }

    if (!course.canUpdate()) {
      await this.logFail(repos, adminId, courseId, 'Khóa học này không thể chỉnh sửa')
      throw new ConflictException('Khóa học này không thể chỉnh sửa')
    }

    return { course, courseRepository }
  }

  private async logFail(repos: any, adminId: number | undefined, courseId: number, errorMessage: string) {
    if (!adminId) return

    await repos.adminAuditLogRepository.create({
      adminId,
      actionKey: ACTION_KEYS.COURSE.UPDATE,
      status: AuditStatus.FAIL,
      resourceType: RESOURCE_TYPES.COURSE,
      resourceId: courseId.toString(),
      errorMessage,
    })
  }

  private async logSuccess(
    repos: any,
    adminId: number | undefined,
    courseId: number,
    beforeData: Record<string, any>,
    afterData: Record<string, any>,
  ) {
    if (!adminId) return

    await repos.adminAuditLogRepository.create({
      adminId,
      actionKey: ACTION_KEYS.COURSE.UPDATE,
      status: AuditStatus.SUCCESS,
      resourceType: RESOURCE_TYPES.COURSE,
      resourceId: courseId.toString(),
      beforeData,
      afterData,
    })
  }
}
