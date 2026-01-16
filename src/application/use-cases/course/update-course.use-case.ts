// src/application/use-cases/course/update-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { UpdateCourseDto } from '../../dtos/course/update-course.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { NotFoundException, ConflictException  } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class UpdateCourseUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork
    ) { }

    async execute(
        courseId: number,
        dto: UpdateCourseDto,
        adminId?: number,
    ): Promise<BaseResponseDto<CourseResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const courseRepository = repos.courseRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingCourse = await courseRepository.findById(courseId)

            if (!existingCourse) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE.UPDATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE,
                        resourceId: courseId.toString(),
                        errorMessage: 'Không tìm thấy khóa học',
                    })
                }
                throw new NotFoundException('Không tìm thấy khóa học')
            }

            if (!existingCourse.canUpdate()) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE.UPDATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE,
                        resourceId: courseId.toString(),
                        errorMessage: 'Khóa học này không thể chỉnh sửa',
                    })
                }
                throw new ConflictException('Khóa học này không thể chỉnh sửa')
            }

            // Validate compareAt price
            const newPrice = dto.priceVND ?? existingCourse.priceVND
            const newCompareAt = dto.compareAtVND ?? existingCourse.compareAtVND

            if (newCompareAt && newCompareAt <= newPrice) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE.UPDATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE,
                        resourceId: courseId.toString(),
                        errorMessage: 'Giá gốc phải lớn hơn giá bán',
                    })
                }
                throw new ConflictException('Giá gốc phải lớn hơn giá bán')
            }

            const updateData = {
                ...dto,
            }

            const updatedCourse = await courseRepository.update(courseId, updateData)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COURSE.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COURSE,
                    resourceId: courseId.toString(),
                    beforeData: {
                        title: existingCourse.title,
                        visibility: existingCourse.visibility,
                        priceVND: existingCourse.priceVND,
                    },
                    afterData: {
                        title: updatedCourse.title,
                        visibility: updatedCourse.visibility,
                        priceVND: updatedCourse.priceVND,
                    },
                })
            }

            return CourseResponseDto.fromEntity(updatedCourse)
        })

        return {
            success: true,
            message: 'Cập nhật khóa học thành công',
            data: result,
        }
    }
}
